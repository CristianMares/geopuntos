import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, firstValueFrom, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { CredencialesLogin, RespuestaLogin } from '../models/auth';
import { UsuarioSesion } from '../models/usuario';

const CLAVE_TOKEN = 'geopuntos.token';
const CLAVE_USUARIO = 'geopuntos.usuario';

/** El almacenamiento puede no estar disponible (modo privado, bloqueado): nunca debe romper la app */
function leer(clave: string): string | null {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function escribir(clave: string, valor: string | null): void {
  try {
    if (valor === null) localStorage.removeItem(clave);
    else localStorage.setItem(clave, valor);
  } catch {
    // Sin almacenamiento la sesión dura solo mientras la pestaña esté abierta
  }
}

function leerUsuario(): UsuarioSesion | null {
  const texto = leer(CLAVE_USUARIO);
  if (!texto) return null;
  try {
    return JSON.parse(texto) as UsuarioSesion;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _token = signal<string | null>(leer(CLAVE_TOKEN));
  private readonly _usuario = signal<UsuarioSesion | null>(leerUsuario());

  readonly token = this._token.asReadonly();
  readonly usuario = this._usuario.asReadonly();
  readonly autenticado = computed(() => this._token() !== null);
  readonly esAdmin = computed(() => this._usuario()?.rol === 'ADMIN');

  login(credenciales: CredencialesLogin): Observable<RespuestaLogin> {
    return this.http
      .post<RespuestaLogin>(`${environment.apiUrl}/auth/login`, credenciales)
      .pipe(tap((respuesta) => this.guardarSesion(respuesta)));
  }

  /**
   * Al abrir la app con un token guardado, confirma con la API que sigue siendo válido
   * y refresca el rol por si cambió. Un 401 cierra la sesión desde el interceptor.
   */
  async restaurarSesion(): Promise<void> {
    if (!this._token()) return;
    try {
      const perfil = await firstValueFrom(
        this.http.get<UsuarioSesion>(`${environment.apiUrl}/auth/perfil`),
      );
      this.actualizarUsuario({ id: perfil.id, nombre: perfil.nombre, rol: perfil.rol });
    } catch {
      // Si la API no responde se conserva la sesión; el 401 ya lo atiende el interceptor
    }
  }

  cerrarSesion(): void {
    this._token.set(null);
    this._usuario.set(null);
    escribir(CLAVE_TOKEN, null);
    escribir(CLAVE_USUARIO, null);
    void this.router.navigate(['/login']);
  }

  private guardarSesion({ token, usuario }: RespuestaLogin): void {
    this._token.set(token);
    escribir(CLAVE_TOKEN, token);
    this.actualizarUsuario(usuario);
  }

  private actualizarUsuario(usuario: UsuarioSesion): void {
    this._usuario.set(usuario);
    escribir(CLAVE_USUARIO, JSON.stringify(usuario));
  }
}
