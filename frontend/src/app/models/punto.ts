import { Categoria } from './categoria';

export interface Punto {
  id: number;
  nombre: string;
  descripcion: string | null;
  latitud: number;
  longitud: number;
  categoria: Categoria;
  registradoPor: { id: number; nombre: string };
  creadoEn: string;
  actualizadoEn: string;
}

/** Lo que se envía al crear o editar un punto */
export interface DatosPunto {
  nombre: string;
  descripcion: string | null;
  latitud: number;
  longitud: number;
  categoriaId: number;
}

export interface FiltrosPuntos {
  q?: string;
  categoriaId?: number;
}
