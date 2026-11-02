import type { z } from 'zod';

export type ResultadoValidacion<T> =
  | { ok: true; datos: T }
  | { ok: false; errores: string[] };

/** Valida un cuerpo con un esquema de zod y devuelve los mensajes en español */
export function validar<T extends z.ZodType>(
  esquema: T,
  cuerpo: unknown,
): ResultadoValidacion<z.infer<T>> {
  const resultado = esquema.safeParse(cuerpo);
  if (resultado.success) return { ok: true, datos: resultado.data };
  return { ok: false, errores: resultado.error.issues.map((i) => i.message) };
}
