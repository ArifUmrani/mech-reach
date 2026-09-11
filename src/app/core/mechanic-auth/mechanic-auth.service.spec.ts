import { TestBed } from '@angular/core/testing';
import { SUPABASE_CLIENT } from '../supabase/supabase-client';
import { MechanicAuthService } from './mechanic-auth.service';

function authClient(overrides: {
  getSession?: () => Promise<{ data: { session: null } }>;
  signInWithOtp?: () => Promise<{ error: null | { message: string } }>;
  verifyOtp?: () => Promise<{
    data: { session: { user: { id: string; phone: string } } | null };
    error: null | { message: string };
  }>;
} = {}) {
  const session = {
    user: { id: 'mechanic-1', phone: '+923012888918' },
  };
  return {
    auth: {
      getSession: overrides.getSession ?? (async () => ({ data: { session: null } })),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe(): void {} } } }),
      signInWithOtp: overrides.signInWithOtp ?? (async () => ({ error: null })),
      verifyOtp: overrides.verifyOtp ?? (async () => ({ data: { session }, error: null })),
      signOut: async () => ({ error: null }),
    },
  };
}

describe('MechanicAuthService', () => {
  it('creates a session after a matching code and clears it on sign-out', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: SUPABASE_CLIENT, useValue: authClient() }],
    });
    const auth = TestBed.inject(MechanicAuthService);
    await auth.whenReady();

    const requested = await auth.requestOtp('+92 301 2888918');
    expect(requested).toEqual({ ok: true, mobile: '+923012888918' });
    expect(await auth.verifyOtp('000789')).toBe('ok');
    expect(auth.signedIn()).toBe(true);
    expect(auth.matchesVerifiedMobile('+92 301 2888918')).toBe(true);

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
    const auth = TestBed.inject(MechanicAuthService);
    await auth.whenReady();
    expect(await auth.verifyOtp('000000')).toBe('missing');

    await auth.requestOtp('+923012888918');
    expect(await auth.verifyOtp('000000')).toBe('expired');
  });
});
