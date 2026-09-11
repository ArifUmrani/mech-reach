export interface MechanicSession {
  readonly id: string;
  readonly mobile: string;
}

export type MechanicOtpVerifyResult = 'ok' | 'expired' | 'mismatch' | 'missing' | 'error';

export type MechanicOtpRequestResult =
  | { readonly ok: true; readonly mobile: string }
  | { readonly ok: false; readonly message: string };
