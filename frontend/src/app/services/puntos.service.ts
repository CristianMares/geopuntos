import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { DatosPunto, Punto } from '../models/punto';
import { mensajeError } from '../utils/errores';
import { ConfirmacionService } from './confirmacion.service';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class PuntosService {
  private readonly http = inject(HttpClient);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly toast = inject(ToastService);
  private readonly url = `${environment.apiUrl}/puntos`;

  listar(): Observable<Punto[]> {
    return this.http.get<Punto[]>(this.url);
  }

  obtener(id: number): Observable<Punto> {
    return this.http.get<Punto>(`${this.url}/${id}`);
  }

  crear(datos: DatosPunto): Observable<Punto> {
    return this.http.post<Punto>(this.url, datos);
  }

  actualizar(id: number, datos: DatosPunto): Observable<Punto> {
    return this.http.put<Punto>(`${this.url}/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  /** Crea varios puntos de una vez; la API los guarda todos o no guarda ninguno */
  importar(puntos: DatosPunto[]): Observable<{ importados: number }> {
    return this.http.post<{ importados: number }>(`${this.url}/importar`, { puntos });
  }

  /**
   * Pregunta con el modal y, si la persona confirma, elimina el punto y avisa.
   * Devuelve true solo si el punto quedó eliminado.
   */
  async eliminarConConfirmacion(punto: Pick<Punto, 'id' | 'nombre'>): Promise<boolean> {
    const confirmado = await this.confirmacion.confirmarEliminacion({
      recurso: 'punto',
      nombre: punto.nombre,
    });
    if (!confirmado) return false;

    try {
      await firstValueFrom(this.eliminar(punto.id));
      this.toast.exito(`Punto "${punto.nombre}" eliminado`);
      return true;
    } catch (error) {
      this.toast.error(mensajeError(error));
      return false;
    }
  }
}
