import bcrypt from 'bcryptjs';
import { DatabaseError } from 'pg';
import { pool } from '../config/db';
import type { Rol, UsuarioConTotal } from '../types';
import { ErrorHttp } from '../utils/errorHttp';
import type {
  DatosActualizarUsuario,
  DatosCrearUsuario,
  FiltrosUsuarios,
} from '../validators/usuarios.validator';

interface FilaUsuario {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  activo: boolean;
  creado_en: Date;
  actualizado_en: Date;
  total_puntos: number;
}

// Nunca se selecciona password_hash: así no puede filtrarse por error
const SELECT_USUARIOS = `
  SELECT u.id, u.nombre, u.correo, u.rol, u.activo, u.creado_en, u.actualizado_en,
         (SELECT COUNT(*)::int FROM puntos p WHERE p.usuario_id = u.id) AS total_puntos
  FROM usuarios u`;

const COSTO_BCRYPT = 10;

function aUsuario(fila: FilaUsuario): UsuarioConTotal {
  return {
    id: fila.id,
    nombre: fila.nombre,
    correo: fila.correo,
    rol: fila.rol,
    activo: fila.activo,
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
    totalPuntos: fila.total_puntos,
  };
}

function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, '\\$&');
}

/** El índice único del correo se traduce a un 409 */
function traducirError(error: unknown): never {
  if (error instanceof DatabaseError && error.code === '23505') {
    throw ErrorHttp.conflicto('Ya existe un usuario con ese correo');
  }
  throw error;
}

export async function listar(filtros: FiltrosUsuarios): Promise<UsuarioConTotal[]> {
  const condiciones: string[] = [];
  const valores: unknown[] = [];

  if (filtros.rol !== undefined) {
    valores.push(filtros.rol);
    condiciones.push(`u.rol = $${valores.length}`);
  }
  if (filtros.q !== undefined) {
    valores.push(`%${escaparLike(filtros.q)}%`);
    condiciones.push(
      `(LOWER(u.nombre) LIKE LOWER($${valores.length}) OR LOWER(u.correo) LIKE LOWER($${valores.length}))`,
    );
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await pool.query<FilaUsuario>(
    `${SELECT_USUARIOS} ${where} ORDER BY u.id`,
    valores,
  );
  return rows.map(aUsuario);
}

export async function obtener(id: number): Promise<UsuarioConTotal> {
  const { rows } = await pool.query<FilaUsuario>(`${SELECT_USUARIOS} WHERE u.id = $1`, [id]);
  const fila = rows[0];
  if (!fila) throw ErrorHttp.noEncontrado('Usuario');
  return aUsuario(fila);
}

export async function crear(datos: DatosCrearUsuario): Promise<UsuarioConTotal> {
  const hash = await bcrypt.hash(datos.password, COSTO_BCRYPT);
  try {
    const { rows } = await pool.query<{ id: number }>(
      `INSERT INTO usuarios (nombre, correo, password_hash, rol, activo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [datos.nombre, datos.correo, hash, datos.rol, datos.activo],
    );
    return await obtener(rows[0]?.id ?? 0);
  } catch (error) {
    return traducirError(error);
  }
}

export async function actualizar(
  id: number,
  datos: DatosActualizarUsuario,
): Promise<UsuarioConTotal> {
  const asignaciones: string[] = [];
  const valores: unknown[] = [];
  // Los nombres de columna son literales fijos; los valores siempre van parametrizados
  const asignar = (columna: string, valor: unknown): void => {
    valores.push(valor);
    asignaciones.push(`${columna} = $${valores.length}`);
  };

  if (datos.nombre !== undefined) asignar('nombre', datos.nombre);
  if (datos.correo !== undefined) asignar('correo', datos.correo);
  if (datos.rol !== undefined) asignar('rol', datos.rol);
  if (datos.activo !== undefined) asignar('activo', datos.activo);
  if (datos.password !== undefined) {
    asignar('password_hash', await bcrypt.hash(datos.password, COSTO_BCRYPT));
  }

  if (asignaciones.length === 0) {
    throw ErrorHttp.invalido('No hay datos para actualizar');
  }

  valores.push(id);
  try {
    const { rowCount } = await pool.query(
      `UPDATE usuarios SET ${asignaciones.join(', ')} WHERE id = $${valores.length}`,
      valores,
    );
    if (rowCount === 0) throw ErrorHttp.noEncontrado('Usuario');
    return await obtener(id);
  } catch (error) {
    return traducirError(error);
  }
}

export async function eliminar(id: number): Promise<void> {
  const { rowCount } = await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
  if (rowCount === 0) throw ErrorHttp.noEncontrado('Usuario');
}
