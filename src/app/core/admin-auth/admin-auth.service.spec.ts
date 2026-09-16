import { TestBed } from '@angular/core/testing';
import { SUPABASE_CLIENT } from '../supabase/supabase-client';
import { AdminAuthService } from './admin-auth.service';

function authClient(overrides: {
  getSession?: () => Promise<{ data: { session: { user: { id: string; phone?: string } } | null } }>;
  rpc?: (fn: string) => Promise<{ data: unknown; error: { message: string } | null }>;
  signInWithOtp?: (args: unknown) => Promise<{ error: { message: string } | null }>;
  verifyOtp?: (args: unknown) => Promise<{
    data: { session: { user: { id: string; phone: string } } | null };
    error: { message: string } | null;
  }>;
  signOut?: () => Promise<{ error: null }>;
} = {}) {
  return {
    auth: {
      getSession:
        overrides.getSession ?? (async () => ({ data: { session: { user: { id: 'user-1' } } } })),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe(): void {} } } }),
      signInWithOtp: overrides.signInWithOtp ?? (async () => ({ error: null })),
      verifyOtp:
        overrides.verifyOtp ??
        (async () => ({
          data: { session: { user: { id: 'user-1', phone: '+923001234567' } } },
          error: null,
        })),
      signOut: overrides.signOut ?? (async () => ({ error: null })),
    },
    rpc: overrides.rpc ?? (async () => ({ data: false, error: null })),
  };
}

describe('AdminAuthService', () => {
  it('is not an admin when signed out, and never calls is_admin()', async () => {
    let rpcCalls = 0;
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SUPABASE_CLIENT,
          useValue: authClient({
            getSession: async () => ({ data: { session: null } }),
            rpc: async () => {
              rpcCalls++;
              return { data: true, error: null };
            },
          }),
        },
      ],
    });
    const admin = TestBed.inject(AdminAuthService);
    await admin.whenReady();
    expect(admin.signedIn()).toBe(false);
    expect(admin.isAdmin()).toBe(false);
    expect(rpcCalls).toBe(0);
  });

  it('is not an admin when is_admin() returns false on restore', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SUPABASE_CLIENT,
          useValue: authClient({ rpc: async () => ({ data: false, error: null }) }),
        },
      ],
    });
    const admin = TestBed.inject(AdminAuthService);
    await admin.whenReady();
    expect(admin.signedIn()).toBe(true);
    expect(admin.isAdmin()).toBe(false);
  });

  it('is an admin when is_admin() returns true on restore', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SUPABASE_CLIENT,
          useValue: authClient({ rpc: async () => ({ data: true, error: null }) }),
        },
      ],
    });
    const admin = TestBed.inject(AdminAuthService);
    await admin.whenReady();
    expect(admin.signedIn()).toBe(true);
    expect(admin.isAdmin()).toBe(true);
  });

  it('fails closed when the is_admin() call errors', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SUPABASE_CLIENT,
          useValue: authClient({
            rpc: async () => ({ data: null, error: { message: 'not authorized' } }),
          }),
        },
      ],
    });
    const admin = TestBed.inject(AdminAuthService);
    await admin.whenReady();
    expect(admin.signedIn()).toBe(true);
    expect(admin.isAdmin()).toBe(false);
  });

  it('sends an OTP for the normalized mobile number', async () => {
    let requestedPhone = '';
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SUPABASE_CLIENT,
          useValue: authClient({
            getSession: async () => ({ data: { session: null } }),
            signInWithOtp: async (args) => {
              requestedPhone = (args as { phone: string }).phone;
              return { error: null };
            },
          }),
        },
      ],
    });
    const admin = TestBed.inject(AdminAuthService);
    await admin.whenReady();
    const result = await admin.requestOtp('+92 300 1234567');
    expect(result).toEqual({ ok: true, mobile: '+923001234567' });
    expect(requestedPhone).toBe('+923001234567');
  });

  it('keeps the session only when is_admin() returns true after OTP', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SUPABASE_CLIENT,
          useValue: authClient({
            getSession: async () => ({ data: { session: null } }),
            rpc: async () => ({ data: true, error: null }),
          }),
        },
      ],
    });
    const admin = TestBed.inject(AdminAuthService);
    await admin.whenReady();
    await admin.requestOtp('+923001234567');
    const result = await admin.verifyOtp('123456');
    expect(result).toBe('ok');
    expect(admin.signedIn()).toBe(true);
    expect(admin.isAdmin()).toBe(true);
  });

  it('signs out and returns forbidden when is_admin() is not true after OTP', async () => {
    let signedOut = false;
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SUPABASE_CLIENT,
          useValue: authClient({
            getSession: async () => ({ data: { session: null } }),
            rpc: async () => ({ data: false, error: null }),
            signOut: async () => {
              signedOut = true;
              return { error: null };
            },
          }),
        },
      ],
    });
    const admin = TestBed.inject(AdminAuthService);
    await admin.whenReady();
    await admin.requestOtp('+923001234567');
    const result = await admin.verifyOtp('123456');
    expect(result).toBe('forbidden');
    expect(signedOut).toBe(true);
    expect(admin.signedIn()).toBe(false);
    expect(admin.isAdmin()).toBe(false);
  });
});
