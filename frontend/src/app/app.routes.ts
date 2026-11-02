import { Routes } from '@angular/router';
import { authGuard, sinSesionGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [sinSesionGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'mapa',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/mapa/mapa').then((m) => m.Mapa),
  },
  { path: '', pathMatch: 'full', redirectTo: 'mapa' },
  // Cualquier otra ruta pasa por /mapa, y si no hay sesión el guard la manda a /login
  { path: '**', redirectTo: 'mapa' },
];
