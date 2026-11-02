import { DatabaseError } from 'pg';
import { pool } from '../config/db';
import type { PuntoDetalle } from '../types';
import { ErrorHttp } from '../utils/errorHttp';
import type { DatosPunto, FiltrosPuntos } from '../validators/puntos.validator';

interface FilaPunto {
  id: number;
  nombre: string;
  descripcion: string | null;
  latitud: string; // NUMERIC llega como texto desde pg
  longitud: string;
  creado_en: Date;
  actualizado_en: Date;
  categoria_id: number;
  categoria_nombre: string;
  categoria_color: string;
  usuario_id: number;
  usuario_nombre: string;
}

const SELECT_PUNTOS = `
  SELECT p.id, p.nombre, p.descripcion, p.latitud, p.longitud,
         p.creado_en, p.actualizado_en,
         c.id AS categoria_id, c.nombre AS categoria_nombre, c.color AS categoria_color,
         u.id AS usuario_id, u.nombre AS usuario_nombre
  FROM puntos p
  JOIN categorias c ON c.id = p.categoria_id
  JOIN usuarios u   ON u.id = p.usuario_id`;

function aPunto(fila: FilaPunto): PuntoDetalle {
  return {
    id: fila.id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    latitud: Number(fila.latitud),
    longitud: Number(fila.longitud),
    categoria: {
      id: fila.categoria_id,
      nombre: fila.categoria_nombre,
      color: fila.categoria_color,
    },
    registradoPor: { id: fila.usuario_id, nombre: fila.usuario_nombre },
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
  };
}

/** Escapa % y _ para que el texto buscado se tome literal dentro de un LIKE */
function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, '\\$&');
}

/** Una categoría inexistente rompe la llave foránea: se devuelve como 400 */
function traducirError(error: unknown): never {
  if (error instanceof DatabaseError && error.code === '23503') {
    throw ErrorHttp.invalido('La categoría indicada no existe');
  }
  throw error;
}

export async function listar(filtros: FiltrosPuntos): Promise<PuntoDetalle[]> {
  const condiciones: string[] = [];
  const valores: unknown[] = [];

  if (filtros.categoriaId !== undefined) {
    valores.push(filtros.categoriaId);
    condiciones.push(`p.categoria_id = $${valores.length}`);
  }
  if (filtros.q !== undefined) {
    valores.push(`%${escaparLike(filtros.q)}%`);
    condiciones.push(`LOWER(p.nombre) LIKE LOWER($${valores.length})`);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await pool.query<FilaPunto>(
    `${SELECT_PUNTOS} ${where} ORDER BY p.creado_en DESC, p.id DESC`,
    valores,
  );
  return rows.map(aPunto);
}

export async function obtener(id: number): Promise<PuntoDetalle> {
  const { rows } = await pool.query<FilaPunto>(`${SELECT_PUNTOS} WHERE p.id = $1`, [id]);
  const fila = rows[0];
  if (!fila) throw ErrorHttp.noEncontrado('Punto');
  return aPunto(fila);
}

export async function crear(datos: DatosPunto, usuarioId: number): Promise<PuntoDetalle> {
  try {
    const { rows } = await pool.query<{ id: number }>(
      `INSERT INTO puntos (nombre, descripcion, latitud, longitud, categoria_id, usuario_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [datos.nombre, datos.descripcion, datos.latitud, datos.longitud, datos.categoriaId, usuarioId],
    );
    return await obtener(rows[0]?.id ?? 0);
  } catch (error) {
    return traducirError(error);
  }
}

export async function actualizar(id: number, datos: DatosPunto): Promise<PuntoDetalle> {
  try {
    const { rowCount } = await pool.query(
      `UPDATE puntos
       SET nombre = $1, descripcion = $2, latitud = $3, longitud = $4, categoria_id = $5
       WHERE id = $6`,
      [datos.nombre, datos.descripcion, datos.latitud, datos.longitud, datos.categoriaId, id],
    );
    if (rowCount === 0) throw ErrorHttp.noEncontrado('Punto');
    return await obtener(id);
  } catch (error) {
    return traducirError(error);
  }
}

export async function eliminar(id: number): Promise<void> {
  const { rowCount } = await pool.query('DELETE FROM puntos WHERE id = $1', [id]);
  if (rowCount === 0) throw ErrorHttp.noEncontrado('Punto');
}
