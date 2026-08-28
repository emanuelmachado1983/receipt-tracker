import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent)
  },
  {
    path: 'planes',
    loadComponent: () => import('./pages/plan-list/plan-list.component').then((m) => m.PlanListComponent)
  },
  {
    path: 'planes/:id',
    loadComponent: () => import('./pages/plan-detail/plan-detail.component').then((m) => m.PlanDetailComponent)
  },
  {
    path: 'estadisticas',
    loadComponent: () => import('./pages/stats/stats.component').then((m) => m.StatsComponent)
  },
  { path: '**', redirectTo: '' }
];
