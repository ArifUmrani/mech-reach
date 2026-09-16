export interface AdminSession {
  readonly id: string;
  readonly mobile: string;
}

export type AdminOtpVerifyResult =
  | 'ok'
  | 'forbidden'
  | 'expired'
  | 'mismatch'
  | 'missing'
  | 'error';

export type AdminOtpRequestResult =
  | { readonly ok: true; readonly mobile: string }
  | { readonly ok: false; readonly message: string };
