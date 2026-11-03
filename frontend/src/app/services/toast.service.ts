import { Injectable, signal } from '@angular/core';

export type TipoAviso = 'exito' | 'error';

export interface Aviso {
  id: number;
  tipo: TipoAviso;
  texto: string;
}

/** Avisos breves que aparecen en una esquina y desaparecen solos */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private siguienteId = 0;
  private readonly _avisos = signal<Aviso[]>([]);

  readonly avisos = this._avisos.asReadonly();

  exito(texto: string): void {
    this.agregar('exito', texto, 4000);
  }

  /** Los errores duran más: hay que dar tiempo a leerlos */
  error(texto: string): void {
    this.agregar('error', texto, 7000);
  }

  cerrar(id: number): void {
    this._avisos.update((lista) => lista.filter((aviso) => aviso.id !== id));
  }

  private agregar(tipo: TipoAviso, texto: string, duracionMs: number): void {
    const id = ++this.siguienteId;
    this._avisos.update((lista) => [...lista, { id, tipo, texto }]);
    setTimeout(() => this.cerrar(id), duracionMs);
  }
}
