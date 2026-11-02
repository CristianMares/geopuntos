import { Routes } from '@angular/router';
import { adminGuard, authGuard, sinSesionGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [sinSesionGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    // Todo lo que va dentro del marco con menú lateral exige sesión
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./components/shell/shell').then((m) => m.Shell),
    children: [
      {
        path: 'mapa',
        loadComponent: () => import('./pages/mapa/mapa').then((m) => m.Mapa),
      },
      {
        path: 'puntos',
        data: { titulo: 'Puntos' },
        loadComponent: () => import('./pages/proximamente/proximamente').then((m) => m.Proximamente),
      },
      {
        path: 'usuarios',
        canActivate: [adminGuard],
        data: { titulo: 'Usuarios' },
        loadComponent: () => import('./pages/proximamente/proximamente').then((m) => m.Proximamente),
      },
      { path: '', pathMatch: 'full', redirectTo: 'mapa' },
    ],
  },
  // Cualquier otra ruta pasa por /mapa, y si no hay sesión el guard la manda a /login
  { path: '**', redirectTo: 'mapa' },
];
