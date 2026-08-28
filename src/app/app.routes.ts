import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'MechReach',
    loadComponent: () => import('./pages/landing/landing').then((module) => module.Landing),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
