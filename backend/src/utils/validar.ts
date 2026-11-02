import type { z } from 'zod';
import { ErrorHttp } from './errorHttp';

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

/** Igual que validar, pero lanza un 400 si los datos no son válidos */
export function exigir<T extends z.ZodType>(esquema: T, datos: unknown): z.infer<T> {
  const resultado = validar(esquema, datos);
  if (!resultado.ok) throw ErrorHttp.invalido(...resultado.errores);
  return resultado.datos;
}

/** Convierte el parámetro :id de la ruta en número o lanza un 400 */
export function leerId(valor: unknown): number {
  const id = typeof valor === 'string' ? Number(valor) : NaN;
  if (!Number.isInteger(id) || id <= 0) {
    throw ErrorHttp.invalido('El id no es válido');
  }
  return id;
}
