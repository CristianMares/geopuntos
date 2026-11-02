import { z } from 'zod';

const nombre = z
  .string({ error: 'El nombre es obligatorio' })
  .trim()
  .min(3, 'El nombre debe tener entre 3 y 100 caracteres')
  .max(100, 'El nombre debe tener entre 3 y 100 caracteres');

const descripcion = z
  .string({ error: 'La descripción debe ser texto' })
  .trim()
  .max(1000, 'La descripción no puede pasar de 1000 caracteres')
  .nullish()
  .transform((valor) => (valor ? valor : null));

const latitud = z
  .number({ error: 'La latitud es obligatoria y debe ser un número' })
  .min(-90, 'La latitud debe estar entre -90 y 90')
  .max(90, 'La latitud debe estar entre -90 y 90');

const longitud = z
  .number({ error: 'La longitud es obligatoria y debe ser un número' })
  .min(-180, 'La longitud debe estar entre -180 y 180')
  .max(180, 'La longitud debe estar entre -180 y 180');

const categoriaId = z
  .number({ error: 'La categoría es obligatoria' })
  .int('La categoría no es válida')
  .positive('La categoría no es válida');

/** Sirve para crear y para actualizar un punto */
export const esquemaPunto = z.object({
  nombre,
  descripcion,
  latitud,
  longitud,
  categoriaId,
});

export type DatosPunto = z.infer<typeof esquemaPunto>;

/** Filtros del listado: ?categoriaId= y ?q= */
export const esquemaFiltrosPuntos = z.object({
  q: z
    .string()
    .trim()
    .optional()
    .transform((valor) => (valor ? valor : undefined)),
  categoriaId: z.coerce
    .number({ error: 'categoriaId debe ser un número' })
    .int('categoriaId debe ser un número entero')
    .positive('categoriaId debe ser un número positivo')
    .optional(),
});

export type FiltrosPuntos = z.infer<typeof esquemaFiltrosPuntos>;
