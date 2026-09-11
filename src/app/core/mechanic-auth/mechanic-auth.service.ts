import { computed, inject, Service, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { maskMobile, normalizeMobile } from '../mechanic-join/mobile';
import { SUPABASE_CLIENT } from '../supabase/supabase-client';
import {
  MechanicOtpRequestResult,
  MechanicOtpVerifyResult,
  MechanicSession,
} from './mechanic-auth.model';

/**
 * Mechanics and customers share the same Supabase Auth identity (one phone
 * number is one `auth.users` row). This service only tracks the mechanic-
 * facing view of that session; it never writes to `profiles` so it cannot
 * clobber a full name saved by `CustomerAuthService`. Mechanic-specific
 * details live in `mechanic_applications`, owned by `MechanicApplicationService`.
 */
@Service()
export class MechanicAuthService {
  private readonly client = inject(SUPABASE_CLIENT);
  private readonly sessionState = signal<MechanicSession | null>(null);
  private pendingMobile = '';
  private readonly ready: Promise<void>;

  readonly session = this.sessionState.asReadonly();
  readonly signedIn = computed(() => this.sessionState() !== null);

  constructor() {
    this.ready = this.restore();
    this.client?.auth.onAuthStateChange((_event, session) => {
      this.applySession(session);
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

  async requestOtp(mobile: string): Promise<MechanicOtpRequestResult> {
    if (!this.client) {
      return { ok: false, message: 'Sign-in is not configured yet.' };
    }

    const normalized = normalizeMobile(mobile);
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

  async verifyOtp(code: string): Promise<MechanicOtpVerifyResult> {
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
    if (!session?.user) {
      return 'error';
    }

    this.applySession(session);
    return 'ok';
  }

  async signOut(): Promise<void> {
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
    this.applySession(data.session);
  }

  private applySession(session: Session | null): void {
    if (!session?.user) {
      this.sessionState.set(null);
      return;
    }

    const mobile = session.user.phone ? normalizeMobile(session.user.phone) : this.pendingMobile;
    this.sessionState.set({ id: session.user.id, mobile });
  }
}
