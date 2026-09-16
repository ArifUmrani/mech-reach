import { computed, inject, Service, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { maskMobile, normalizeMobile } from '../mechanic-join/mobile';
import { SUPABASE_CLIENT } from '../supabase/supabase-client';
import {
  AdminOtpRequestResult,
  AdminOtpVerifyResult,
  AdminSession,
} from './admin-auth.model';

/**
 * Admin-portal auth. Uses the same Supabase Auth phone OTP identity as
 * customers/mechanics, but this service is only for the `/admin` UI. After
 * OTP verification it calls `public.is_admin()` and only keeps the session
 * when that returns exactly `true`. Non-staff accounts are signed out.
 */
@Service()
export class AdminAuthService {
  private readonly client = inject(SUPABASE_CLIENT);
  private readonly sessionState = signal<AdminSession | null>(null);
  private readonly isAdminState = signal(false);
  private pendingMobile = '';
  private readonly ready: Promise<void>;

  readonly session = this.sessionState.asReadonly();
  readonly signedIn = computed(() => this.sessionState() !== null);
  readonly isAdmin = this.isAdminState.asReadonly();

  constructor() {
    this.ready = this.restore();
    this.client?.auth.onAuthStateChange((_event, session) => {
      void this.applySession(session);
    });
  }

  whenReady(): Promise<void> {
    return this.ready;
  }

  userId(): string | null {
    return this.sessionState()?.id ?? null;
  }

  async requestOtp(mobile: string): Promise<AdminOtpRequestResult> {
    if (!this.client) {
      return { ok: false, message: 'Admin sign-in is not configured yet.' };
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

  async verifyOtp(code: string): Promise<AdminOtpVerifyResult> {
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

    const allowed = await this.refreshAdminFlag();
    if (!allowed) {
      await this.signOut();
      return 'forbidden';
    }

    this.applySessionWithoutAdminCheck(session);
    this.isAdminState.set(true);
    return 'ok';
  }

  async signOut(): Promise<void> {
    this.pendingMobile = '';
    this.sessionState.set(null);
    this.isAdminState.set(false);
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
    await this.applySession(data.session);
  }

  private async applySession(session: Session | null): Promise<void> {
    if (!session?.user) {
      this.sessionState.set(null);
      this.isAdminState.set(false);
      return;
    }

    this.applySessionWithoutAdminCheck(session);
    const allowed = await this.refreshAdminFlag();
    if (!allowed) {
      // Keep a non-admin Supabase session from looking like an admin portal
      // session. The sign-in page can still detect a stray Auth session and
      // sign it out after showing "Admin access required".
      this.isAdminState.set(false);
    }
  }

  private applySessionWithoutAdminCheck(session: Session): void {
    const mobile = session.user.phone ? normalizeMobile(session.user.phone) : this.pendingMobile;
    this.sessionState.set({ id: session.user.id, mobile });
  }

  private async refreshAdminFlag(): Promise<boolean> {
    if (!this.client) {
      this.isAdminState.set(false);
      return false;
    }

    // Fail closed: only an explicit `true` from the function marks the
    // user as admin. Any error is treated as not-admin.
    const { data, error } = await this.client.rpc('is_admin');
    const allowed = !error && data === true;
    this.isAdminState.set(allowed);
    return allowed;
  }
}
