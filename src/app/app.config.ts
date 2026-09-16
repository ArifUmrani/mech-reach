import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { AdminAuthService } from './core/admin-auth/admin-auth.service';
import { CustomerAuthService } from './core/customer-auth/customer-auth.service';
import { MechanicAuthService } from './core/mechanic-auth/mechanic-auth.service';
import { createSupabaseClient, SUPABASE_CLIENT } from './core/supabase/supabase-client';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: SUPABASE_CLIENT, useFactory: createSupabaseClient },
    provideAppInitializer(() => inject(CustomerAuthService).whenReady()),
    provideAppInitializer(() => inject(MechanicAuthService).whenReady()),
    provideAppInitializer(() => inject(AdminAuthService).whenReady()),
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'top',
      }),
    ),
  ],
};
