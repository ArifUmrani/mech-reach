import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';

/** Protects admin pages. Signed-out and non-admin users go to /admin/signin. */
export const requireAdminSession: CanActivateFn = () => {
  const admin = inject(AdminAuthService);
  const router = inject(Router);

  if (!admin.signedIn() || !admin.isAdmin()) {
    return router.createUrlTree(['/admin/signin']);
  }

  return true;
};

/** Sends an already-authorized admin away from the sign-in page. */
export const redirectIfAdminSignedIn: CanActivateFn = () => {
  const admin = inject(AdminAuthService);
  const router = inject(Router);

  if (admin.signedIn() && admin.isAdmin()) {
    return router.createUrlTree(['/admin/dashboard']);
  }

  return true;
};
