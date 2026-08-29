import { isValidMobile, normalizeMobile } from '../mechanic-join/mobile';

export const CUSTOMER_SESSION_STORAGE_KEY = 'mechreach-customer-session';

export interface CustomerSession {
  readonly fullName: string;
  readonly mobile: string;
}

export function parseCustomerSession(raw: string | null): CustomerSession | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    const fullName = typeof record['fullName'] === 'string' ? record['fullName'].trim() : '';
    const mobile = typeof record['mobile'] === 'string' ? record['mobile'] : '';
    if (!fullName || !isValidMobile(mobile)) {
      return null;
    }

    return {
      fullName,
      mobile: normalizeMobile(mobile),
    };
  } catch {
    return null;
  }
}
