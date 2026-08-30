import { TestBed } from '@angular/core/testing';
import { SUPABASE_CLIENT } from '../supabase/supabase-client';
import { CustomerAuthService } from './customer-auth.service';

function authClient(overrides: {
  getSession?: () => Promise<{ data: { session: null } }>;
  signInWithOtp?: () => Promise<{ error: null | { message: string } }>;
  verifyOtp?: () => Promise<{
    data: { session: { user: { id: string; phone: string } } | null };
    error: null | { message: string };
  }>;
  upsert?: () => Promise<{ error: null }>;
  selectResult?: { full_name: string; mobile_e164: string } | null;
} = {}) {
  const session = {
    user: { id: 'user-1', phone: '+923001234567' },
  };
  return {
    auth: {
      getSession: overrides.getSession ?? (async () => ({ data: { session: null } })),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe(): void {} } } }),
      signInWithOtp:
        overrides.signInWithOtp ??
        (async () => ({ error: null })),
      verifyOtp:
        overrides.verifyOtp ??
        (async () => ({ data: { session }, error: null })),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      upsert: overrides.upsert ?? (async () => ({ error: null })),
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: overrides.selectResult ?? { full_name: 'Arif', mobile_e164: '+923001234567' },
            error: null,
          }),
        }),
      }),
    }),
  };
}

describe('CustomerAuthService', () => {
  it('creates a session after a matching code and clears it on sign-out', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: SUPABASE_CLIENT, useValue: authClient() }],
    });
    const auth = TestBed.inject(CustomerAuthService);
    await auth.whenReady();

    const requested = await auth.requestOtp('Arif', '+92 300 1234567');
    expect(requested).toEqual({ ok: true, mobile: '+923001234567' });
    expect(await auth.verifyOtp('221292')).toBe('ok');
    expect(auth.signedIn()).toBe(true);
    expect(auth.session()?.fullName).toBe('Arif');
    expect(auth.matchesVerifiedMobile('+92 300 1234567')).toBe(true);

    await auth.signOut();
    expect(auth.signedIn()).toBe(false);
    expect(auth.session()).toBeNull();
  });

  it('rejects a missing challenge and maps an expired code', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SUPABASE_CLIENT,
          useValue: authClient({
            verifyOtp: async () => ({
              data: { session: null },
              error: { message: 'Token has expired or is invalid' },
            }),
          }),
        },
      ],
    });
    const auth = TestBed.inject(CustomerAuthService);
    await auth.whenReady();
    expect(await auth.verifyOtp('000000')).toBe('missing');

    await auth.requestOtp('Arif', '+923001234567');
    expect(await auth.verifyOtp('000000')).toBe('expired');
  });
});
