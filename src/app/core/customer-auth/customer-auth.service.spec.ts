import { TestBed } from '@angular/core/testing';
import { CUSTOMER_SESSION_STORAGE_KEY, parseCustomerSession } from './customer-auth.model';
import { CustomerAuthService } from './customer-auth.service';

describe('parseCustomerSession', () => {
  it('accepts a valid stored session and rejects incomplete payloads', () => {
    expect(
      parseCustomerSession(JSON.stringify({ fullName: 'Arif', mobile: '+923001234567' })),
    ).toEqual({ fullName: 'Arif', mobile: '+923001234567' });
    expect(parseCustomerSession(JSON.stringify({ fullName: 'Arif' }))).toBeNull();
    expect(parseCustomerSession('not-json')).toBeNull();
  });
});

describe('CustomerAuthService', () => {
  beforeEach(() => {
    sessionStorage.removeItem(CUSTOMER_SESSION_STORAGE_KEY);
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    sessionStorage.removeItem(CUSTOMER_SESSION_STORAGE_KEY);
  });

  it('creates a temporary session after a matching code and clears the challenge', () => {
    const auth = TestBed.inject(CustomerAuthService);
    const challenge = auth.requestOtp('Arif', '+92 300 1234567');

    expect(auth.verifyOtp('000000')).toBe('mismatch');
    expect(auth.verifyOtp(challenge.code)).toBe('ok');
    expect(auth.signedIn()).toBe(true);
    expect(auth.session()).toEqual({ fullName: 'Arif', mobile: '+923001234567' });
    expect(auth.matchesVerifiedMobile('+92 300 1234567')).toBe(true);
    expect(auth.verifyOtp(challenge.code)).toBe('missing');
    expect(sessionStorage.getItem(CUSTOMER_SESSION_STORAGE_KEY)).toContain('Arif');
  });

  it('clears the session on sign-out', () => {
    const auth = TestBed.inject(CustomerAuthService);
    const challenge = auth.requestOtp('Arif', '+92 300 1234567');
    expect(auth.verifyOtp(challenge.code)).toBe('ok');

    auth.signOut();
    expect(auth.signedIn()).toBe(false);
    expect(auth.session()).toBeNull();
    expect(auth.matchesVerifiedMobile('+923001234567')).toBe(false);
    expect(sessionStorage.getItem(CUSTOMER_SESSION_STORAGE_KEY)).toBeNull();
  });
});
