import { InjectionToken } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export type MechReachSupabaseClient = SupabaseClient;

export const SUPABASE_CLIENT = new InjectionToken<MechReachSupabaseClient | null>(
  'SUPABASE_CLIENT',
);

export function isSupabaseConfigured(
  url = environment.supabaseUrl,
  publishableKey = environment.supabasePublishableKey,
): boolean {
  const key = publishableKey.trim();
  return url.trim().startsWith('https://') && (key.startsWith('sb_publishable_') || key.length > 20);
}

export function createSupabaseClient(): MechReachSupabaseClient | null {
  const url = environment.supabaseUrl.trim();
  const publishableKey = environment.supabasePublishableKey.trim();
  if (!isSupabaseConfigured(url, publishableKey)) {
    return null;
  }

  return createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export function developmentOtpHint(): string {
  if (environment.production) {
    return '';
  }

  return environment.testOtpHint.trim();
}
