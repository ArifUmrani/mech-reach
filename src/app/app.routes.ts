import { Routes } from '@angular/router';
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
