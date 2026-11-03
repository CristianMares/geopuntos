import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { DatosUsuario, Usuario } from '../models/usuario';
import { mensajeError } from '../utils/errores';
import { ConfirmacionService } from './confirmacion.service';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly toast = inject(ToastService);
  private readonly url = `${environment.apiUrl}/usuarios`;

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.url);
  }

  crear(datos: DatosUsuario): Observable<Usuario> {
    return this.http.post<Usuario>(this.url, datos);
  }

  actualizar(id: number, datos: Partial<DatosUsuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.url}/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  /**
   * Pregunta con el modal y, si la persona confirma, elimina al usuario y avisa.
   * Si tiene puntos registrados, el modal advierte que se eliminan junto con él.
   * Devuelve true solo si el usuario quedó eliminado.
   */
  async eliminarConConfirmacion(usuario: Usuario): Promise<boolean> {
    const total = usuario.totalPuntos;
    const confirmado = await this.confirmacion.confirmarEliminacion({
      recurso: 'usuario',
      nombre: usuario.nombre,
      detalle:
        total === 0
          ? undefined
          : total === 1
            ? 'También se eliminará el punto que registró.'
            : `También se eliminarán los ${total} puntos que registró.`,
    });
    if (!confirmado) return false;

    try {
      await firstValueFrom(this.eliminar(usuario.id));
      this.toast.exito(`Usuario "${usuario.nombre}" eliminado`);
      return true;
    } catch (error) {
      this.toast.error(mensajeError(error));
      return false;
    }
  }
}
