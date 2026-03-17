import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login')
        .then(m => m.LoginComponent)
  },

  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register')
        .then(m => m.RegisterComponent)
  },

  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard')
        .then(m => m.DashboardComponent)
  },

  {
    path: 'city/:name',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/city/city')
        .then(m => m.CityComponent)
  },

  {
    path: 'compare',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/compare/compare')
        .then(m => m.CompareComponent)
  },

  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/settings/settings')
        .then(m => m.SettingsComponent)
  },
  
  {
    path: 'make-admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/make-admin/make-admin')
        .then(m => m.MakeAdminComponent)
  }, 
  
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  {
    path: '**',
    redirectTo: 'dashboard'
  }
];