import { computed, inject, Service, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { maskMobile, normalizeMobile } from '../mechanic-join/mobile';
import { SUPABASE_CLIENT } from '../supabase/supabase-client';
import {
  CustomerOtpRequestResult,
  CustomerOtpVerifyResult,
  CustomerSession,
} from './customer-auth.model';

@Service()
export class CustomerAuthService {
  private readonly client = inject(SUPABASE_CLIENT);
  private readonly sessionState = signal<CustomerSession | null>(null);
  private pendingFullName = '';
  private pendingMobile = '';
  private readonly ready: Promise<void>;

  readonly session = this.sessionState.asReadonly();
  readonly signedIn = computed(() => this.sessionState() !== null);

  constructor() {
    this.ready = this.restore();
    this.client?.auth.onAuthStateChange((_event, session) => {
      void this.applyAuthSession(session);
    });
  }

  whenReady(): Promise<void> {
    return this.ready;
  }

  userId(): string | null {
    return this.sessionState()?.id ?? null;
  }

  matchesVerifiedMobile(mobile: string): boolean {
    const session = this.sessionState();
    return !!session && session.mobile === normalizeMobile(mobile);
  }

  async requestOtp(fullName: string, mobile: string): Promise<CustomerOtpRequestResult> {
    if (!this.client) {
      return { ok: false, message: 'Sign-in is not configured yet.' };
    }

    const normalized = normalizeMobile(mobile);
    this.pendingFullName = fullName.trim();
    this.pendingMobile = normalized;
    const { error } = await this.client.auth.signInWithOtp({
      phone: normalized,
      options: { shouldCreateUser: true, channel: 'sms' },
    });
    if (error) {
      return { ok: false, message: error.message || 'Could not send a confirmation code.' };
    }

    return { ok: true, mobile: normalized };
  }

  async verifyOtp(code: string): Promise<CustomerOtpVerifyResult> {
    if (!this.client) {
      return 'error';
    }

    const phone = this.pendingMobile || this.sessionState()?.mobile || '';
    if (!phone) {
      return 'missing';
    }

    const token = code.trim();
    if (!token) {
      return 'mismatch';
    }

    const { data, error } = await this.client.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    if (error) {
      const text = error.message.toLowerCase();
      if (text.includes('expired')) {
        return 'expired';
      }
      if (text.includes('invalid') || text.includes('token')) {
        return 'mismatch';
      }
      return 'error';
    }

    const session = data.session;
    if (!session) {
      return 'error';
    }

    await this.upsertProfile(session);
    await this.applyAuthSession(session);
    return 'ok';
  }

  async signOut(): Promise<void> {
    this.pendingFullName = '';
    this.pendingMobile = '';
    this.sessionState.set(null);
    await this.client?.auth.signOut();
  }

  maskedMobile(): string {
    const mobile = this.sessionState()?.mobile || this.pendingMobile;
    return mobile ? maskMobile(mobile) : '';
  }

  private async restore(): Promise<void> {
    if (!this.client) {
      return;
    }

    const { data } = await this.client.auth.getSession();
    await this.applyAuthSession(data.session);
  }

  private async applyAuthSession(session: Session | null): Promise<void> {
    if (!session?.user) {
      this.sessionState.set(null);
      return;
    }

    const phone = session.user.phone ? normalizeMobile(session.user.phone) : this.pendingMobile;
    let fullName = this.pendingFullName || this.sessionState()?.fullName || '';
    let mobile = phone;

    if (this.client) {
      const { data } = await this.client
        .from('profiles')
        .select('full_name, mobile_e164')
        .eq('id', session.user.id)
        .maybeSingle();
      if (data && typeof data['full_name'] === 'string' && data['full_name'].trim()) {
        fullName = data['full_name'].trim();
      }
      if (data && typeof data['mobile_e164'] === 'string' && data['mobile_e164'].trim()) {
        mobile = normalizeMobile(data['mobile_e164']);
      }
    }

    this.sessionState.set({
      id: session.user.id,
      fullName,
      mobile,
    });
  }

  private async upsertProfile(session: Session): Promise<void> {
    if (!this.client) {
      return;
    }

    const mobile = normalizeMobile(session.user.phone || this.pendingMobile);
    await this.client.from('profiles').upsert({
      id: session.user.id,
      full_name: this.pendingFullName,
      mobile_e164: mobile,
    });
  }
}
