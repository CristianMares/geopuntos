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
        loadComponent: () => import('./pages/puntos/puntos').then((m) => m.Puntos),
      },
      {
        // Debe ir antes que 'puntos/:id/editar'; ambas usan el mismo formulario
        path: 'puntos/nuevo',
        loadComponent: () => import('./pages/punto-form/punto-form').then((m) => m.PuntoForm),
      },
      {
        path: 'puntos/:id/editar',
        loadComponent: () => import('./pages/punto-form/punto-form').then((m) => m.PuntoForm),
      },
      {
        path: 'usuarios',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/usuarios/usuarios').then((m) => m.Usuarios),
      },
      { path: '', pathMatch: 'full', redirectTo: 'mapa' },
    ],
  },
  // Cualquier otra ruta pasa por /mapa, y si no hay sesión el guard la manda a /login
  { path: '**', redirectTo: 'mapa' },
];
