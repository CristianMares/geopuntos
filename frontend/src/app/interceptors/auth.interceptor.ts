import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

/**
 * Agrega el token a cada petición hacia la API y, si la API responde 401
 * (token vencido o usuario desactivado), cierra la sesión y manda a /login.
 */
export const authInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const esDeLaApi = peticion.url.startsWith(environment.apiUrl);

  // El token solo se envía a nuestra API, nunca a terceros
  const conToken =
    token && esDeLaApi
      ? peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : peticion;

  return siguiente(conToken).pipe(
    catchError((error: unknown) => {
      const esLogin = peticion.url.endsWith('/auth/login');
      if (error instanceof HttpErrorResponse && error.status === 401 && !esLogin) {
        auth.cerrarSesion();
      }
      return throwError(() => error);
    }),
  );
};
