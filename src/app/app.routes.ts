import { Routes } from '@angular/router';
import {
  redirectIfAdminSignedIn,
  requireAdminSession,
} from './core/admin-auth/admin-auth.guards';
import {
  redirectIfCustomerSignedIn,
  requireCustomerSession,
} from './core/customer-auth/customer-auth.guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'MechReach',
    loadComponent: () => import('./pages/landing/landing').then((module) => module.Landing),
  },
  {
    path: 'mechanic/join',
    title: 'Become a Mechanic | MechReach',
    loadComponent: () =>
      import('./pages/mechanic-join/mechanic-join').then((module) => module.MechanicJoin),
  },
  {
    path: 'request',
    title: 'Request a Mechanic | MechReach',
    loadComponent: () =>
      import('./pages/customer-request/customer-request').then((module) => module.CustomerRequest),
  },
  {
    path: 'signin',
    title: 'Sign In | MechReach',
    canActivate: [redirectIfCustomerSignedIn],
    loadComponent: () =>
      import('./pages/customer-signin/customer-signin').then((module) => module.CustomerSignin),
  },
  {
    path: 'account',
    title: 'Account | MechReach',
    canActivate: [requireCustomerSession],
    loadComponent: () =>
      import('./pages/customer-account/customer-account').then((module) => module.CustomerAccount),
  },
  {
    path: 'admin/signin',
    title: 'Admin Sign In | MechReach',
    canActivate: [redirectIfAdminSignedIn],
    loadComponent: () =>
      import('./pages/admin-signin/admin-signin').then((module) => module.AdminSignin),
  },
  {
    path: 'admin',
    canActivate: [requireAdminSession],
    loadComponent: () =>
      import('./layout/admin-shell/admin-shell').then((module) => module.AdminShell),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        title: 'Admin Dashboard | MechReach',
        loadComponent: () =>
          import('./pages/admin-dashboard/admin-dashboard').then((module) => module.AdminDashboard),
      },
      {
        path: 'mechanics',
        title: 'Mechanic Applications | MechReach',
        loadComponent: () =>
          import('./pages/admin-mechanic-applications/admin-mechanic-applications').then(
            (module) => module.AdminMechanicApplications,
          ),
      },
      {
        path: 'customers',
        title: 'Customers | MechReach Admin',
        loadComponent: () =>
          import('./pages/admin-customers/admin-customers').then((module) => module.AdminCustomers),
      },
      {
        path: 'jobs',
        title: 'Jobs | MechReach Admin',
        loadComponent: () =>
          import('./pages/admin-jobs/admin-jobs').then((module) => module.AdminJobs),
      },
    ],
  },
  {
    path: 'request-a-mechanic',
    redirectTo: '/request',
    pathMatch: 'full',
  },
  {
    path: 'become-a-mechanic',
    redirectTo: '/mechanic/join',
    pathMatch: 'full',
  },
  {
    path: 'sign-in',
    redirectTo: '/signin',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
