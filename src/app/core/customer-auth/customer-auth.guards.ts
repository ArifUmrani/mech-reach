import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CustomerAuthService } from './customer-auth.service';

export const requireCustomerSession: CanActivateFn = () => {
  const auth = inject(CustomerAuthService);
  const router = inject(Router);
  return auth.signedIn() ? true : router.createUrlTree(['/signin']);
};

export const redirectIfCustomerSignedIn: CanActivateFn = () => {
  const auth = inject(CustomerAuthService);
  const router = inject(Router);
  return auth.signedIn() ? router.createUrlTree(['/account']) : true;
};
