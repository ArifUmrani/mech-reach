import { DOCUMENT } from '@angular/common';
import { computed, inject, Service, signal } from '@angular/core';
import { maskMobile, normalizeMobile } from '../mechanic-join/mobile';
import {
  CUSTOMER_SESSION_STORAGE_KEY,
  CustomerSession,
  parseCustomerSession,
} from './customer-auth.model';

export type CustomerOtpVerifyResult = 'ok' | 'expired' | 'mismatch' | 'missing';

interface OtpChallenge {
  readonly fullName: string;
  readonly mobile: string;
  readonly code: string;
  readonly expiresAt: number;
}

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_LENGTH = 6;

@Service()
export class CustomerAuthService {
  private readonly document = inject(DOCUMENT);
  private readonly sessionState = signal<CustomerSession | null>(this.readStoredSession());
  private readonly challenge = signal<OtpChallenge | null>(null);

  readonly session = this.sessionState.asReadonly();
  readonly signedIn = computed(() => this.sessionState() !== null);

  matchesVerifiedMobile(mobile: string): boolean {
    const session = this.sessionState();
    return !!session && session.mobile === normalizeMobile(mobile);
  }

  requestOtp(fullName: string, mobile: string): { readonly mobile: string; readonly code: string } {
    const normalized = normalizeMobile(mobile);
    const code = this.generateOtp();
    this.challenge.set({
      fullName: fullName.trim(),
      mobile: normalized,
      code,
      expiresAt: Date.now() + OTP_TTL_MS,
    });
    return { mobile: normalized, code };
  }

  verifyOtp(code: string): CustomerOtpVerifyResult {
    const current = this.challenge();
    if (!current) {
      return 'missing';
    }

    if (Date.now() > current.expiresAt) {
      return 'expired';
    }

    if (code.trim() !== current.code) {
      return 'mismatch';
    }

    const session: CustomerSession = {
      fullName: current.fullName,
      mobile: current.mobile,
    };
    this.sessionState.set(session);
    this.writeStoredSession(session);
    this.challenge.set(null);
    return 'ok';
  }

  signOut(): void {
    this.sessionState.set(null);
    this.challenge.set(null);
    this.writeStoredSession(null);
  }

  maskedMobile(): string {
    const mobile = this.sessionState()?.mobile || this.challenge()?.mobile;
    return mobile ? maskMobile(mobile) : '';
  }

  private readStoredSession(): CustomerSession | null {
    return parseCustomerSession(this.storage()?.getItem(CUSTOMER_SESSION_STORAGE_KEY) ?? null);
  }

  private writeStoredSession(session: CustomerSession | null): void {
    const storage = this.storage();
    if (!storage) {
      return;
    }

    if (!session) {
      storage.removeItem(CUSTOMER_SESSION_STORAGE_KEY);
      return;
    }

    storage.setItem(CUSTOMER_SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  private storage(): Storage | null {
    return this.document.defaultView?.sessionStorage ?? null;
  }

  private generateOtp(): string {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    return String(bytes[0] % 10 ** OTP_LENGTH).padStart(OTP_LENGTH, '0');
  }
}
