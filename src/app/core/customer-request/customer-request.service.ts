import { Service, signal } from '@angular/core';
import { maskMobile, normalizeMobile } from '../mechanic-join/mobile';
import {
  createRequestReference,
  CustomerRequestDraft,
  emptyRequestDraft,
} from './customer-request.model';

export type OtpVerifyResult = 'ok' | 'expired' | 'mismatch' | 'missing';

interface OtpChallenge {
  readonly mobile: string;
  readonly code: string;
  readonly expiresAt: number;
}

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_LENGTH = 6;

@Service()
export class CustomerRequestService {
  private readonly draftState = signal<CustomerRequestDraft>(emptyRequestDraft());
  private readonly challenge = signal<OtpChallenge | null>(null);
  private readonly submittedState = signal(false);

  readonly draft = this.draftState.asReadonly();
  readonly submitted = this.submittedState.asReadonly();

  patch(partial: Partial<CustomerRequestDraft>): void {
    this.draftState.update((current) => ({ ...current, ...partial }));
  }

  requestOtp(mobile: string): { readonly mobile: string; readonly code: string } {
    const normalized = normalizeMobile(mobile);
    const code = this.generateOtp();
    this.challenge.set({
      mobile: normalized,
      code,
      expiresAt: Date.now() + OTP_TTL_MS,
    });
    this.patch({ mobile: normalized, mobileVerified: false });
    return { mobile: normalized, code };
  }

  verifyOtp(code: string): OtpVerifyResult {
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

    this.patch({ mobile: current.mobile, mobileVerified: true });
    return 'ok';
  }

  maskedMobile(): string {
    const mobile = this.draftState().mobile || this.challenge()?.mobile;
    return mobile ? maskMobile(mobile) : '';
  }

  submitRequest(): void {
    this.draftState.update((draft) => ({
      ...draft,
      reference: draft.reference || createRequestReference(),
    }));
    this.submittedState.set(true);
  }

  reset(): void {
    this.draftState.set(emptyRequestDraft());
    this.challenge.set(null);
    this.submittedState.set(false);
  }

  private generateOtp(): string {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    return String(bytes[0] % 10 ** OTP_LENGTH).padStart(OTP_LENGTH, '0');
  }
}
