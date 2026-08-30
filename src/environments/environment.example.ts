/**
 * Copy this file to environment.development.ts (gitignored) and paste:
 * - Project URL
 * - Publishable key (sb_publishable_...)
 * Never put a secret or service_role key in Angular.
 * testOtpHint is shown only when production is false (ng serve).
 */
export const environment = {
  production: false,
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabasePublishableKey: 'sb_publishable_YOUR_KEY',
  testOtpHint: '',
};
