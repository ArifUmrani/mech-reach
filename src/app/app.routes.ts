import { Routes } from '@angular/router';

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
    path: 'become-a-mechanic',
    redirectTo: '/mechanic/join',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
