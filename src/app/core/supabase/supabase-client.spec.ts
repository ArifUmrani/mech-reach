import { createSupabaseClient, developmentOtpHint, isSupabaseConfigured } from './supabase-client';

describe('createSupabaseClient', () => {
  it('does not create a client when the environment is empty', () => {
    expect(isSupabaseConfigured('', '')).toBe(false);
    expect(createSupabaseClient()).toBeNull();
  });

  it('accepts a hosted project URL and publishable key', () => {
    expect(
      isSupabaseConfigured('https://abc.supabase.co', `sb_publishable_${'a'.repeat(24)}`),
    ).toBe(true);
  });
});

describe('developmentOtpHint', () => {
  it('is empty in the production environment file used by tests', () => {
    expect(developmentOtpHint()).toBe('');
  });
});
