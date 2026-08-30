export interface CustomerSession {
  readonly id: string;
  readonly fullName: string;
  readonly mobile: string;
}

export type CustomerOtpVerifyResult = 'ok' | 'expired' | 'mismatch' | 'missing' | 'error';

export type CustomerOtpRequestResult =
  | { readonly ok: true; readonly mobile: string }
  | { readonly ok: false; readonly message: string };
