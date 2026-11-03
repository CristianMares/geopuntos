import { Injectable, signal } from '@angular/core';

export interface OpcionesEliminacion {
  /** Qué se va a eliminar, por ejemplo "punto" o "usuario" */
  recurso: string;
  /** Nombre del registro, para que se vea cuál es */
  nombre: string;
  /** Aviso adicional, por ejemplo cuántos datos se van junto con él */
  detalle?: string;
}

export interface SolicitudConfirmacion extends OpcionesEliminacion {
  resolver: (confirmado: boolean) => void;
}

/** Abre el modal de confirmación y devuelve la respuesta de la persona */
@Injectable({ providedIn: 'root' })
export class ConfirmacionService {
  private readonly _solicitud = signal<SolicitudConfirmacion | null>(null);

  readonly solicitud = this._solicitud.asReadonly();

  confirmarEliminacion(opciones: OpcionesEliminacion): Promise<boolean> {
    // Si ya había una pregunta abierta, se da por cancelada
    this._solicitud()?.resolver(false);
    return new Promise<boolean>((resolver) => {
      this._solicitud.set({ ...opciones, resolver });
    });
  }

  responder(confirmado: boolean): void {
    const solicitud = this._solicitud();
    this._solicitud.set(null);
    solicitud?.resolver(confirmado);
  }
}
