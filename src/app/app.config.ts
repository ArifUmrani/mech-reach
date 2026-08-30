import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { CustomerAuthService } from './core/customer-auth/customer-auth.service';
import { createSupabaseClient, SUPABASE_CLIENT } from './core/supabase/supabase-client';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: SUPABASE_CLIENT, useFactory: createSupabaseClient },
    provideAppInitializer(() => inject(CustomerAuthService).whenReady()),
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'top',
      }),
    ),
  ],
};
