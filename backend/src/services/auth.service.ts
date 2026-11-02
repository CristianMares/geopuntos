import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { pool } from '../config/db';
import { env } from '../config/env';
import type { Rol, SesionUsuario, Usuario, UsuarioConHash } from '../types';

interface FilaUsuario {
  id: number;
  nombre: string;
  correo: string;
  password_hash: string;
  rol: Rol;
  activo: boolean;
  creado_en: Date;
  actualizado_en: Date;
}

const COLUMNAS =
  'id, nombre, correo, password_hash, rol, activo, creado_en, actualizado_en';

// Hash de relleno: si el correo no existe se compara igual, para que el
// tiempo de respuesta no revele qué correos están registrados
const HASH_RELLENO = bcrypt.hashSync('relleno-sin-uso', 10);

function aUsuario(fila: FilaUsuario): UsuarioConHash {
  return {
    id: fila.id,
    nombre: fila.nombre,
    correo: fila.correo,
    passwordHash: fila.password_hash,
    rol: fila.rol,
    activo: fila.activo,
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
  };
}

/** Quita el hash antes de que el usuario salga del servicio */
function sinHash({ passwordHash: _omitido, ...usuario }: UsuarioConHash): Usuario {
  return usuario;
}

export async function buscarPorId(id: number): Promise<Usuario | null> {
  const { rows } = await pool.query<FilaUsuario>(
    `SELECT ${COLUMNAS} FROM usuarios WHERE id = $1`,
    [id],
  );
  const fila = rows[0];
  return fila ? sinHash(aUsuario(fila)) : null;
}

export type ResultadoLogin =
  | { ok: true; usuario: Usuario }
  | { ok: false; motivo: 'CREDENCIALES' | 'INACTIVO' };

export async function verificarCredenciales(
  correo: string,
  password: string,
): Promise<ResultadoLogin> {
  const { rows } = await pool.query<FilaUsuario>(
    `SELECT ${COLUMNAS} FROM usuarios WHERE LOWER(correo) = LOWER($1)`,
    [correo],
  );
  const fila = rows[0];
  const hash = fila ? fila.password_hash : HASH_RELLENO;
  const coincide = await bcrypt.compare(password, hash);

  if (!fila || !coincide) return { ok: false, motivo: 'CREDENCIALES' };

  // El estado se revela solo si la contraseña era correcta
  if (!fila.activo) return { ok: false, motivo: 'INACTIVO' };

  return { ok: true, usuario: sinHash(aUsuario(fila)) };
}

export function generarToken(usuario: Pick<Usuario, 'id' | 'rol'>): string {
  const sesion: SesionUsuario = { id: usuario.id, rol: usuario.rol };
  const opciones: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(sesion, env.JWT_SECRET, opciones);
}

export function verificarToken(token: string): SesionUsuario {
  const payload = jwt.verify(token, env.JWT_SECRET);
  if (
    typeof payload === 'string' ||
    typeof payload.id !== 'number' ||
    (payload.rol !== 'ADMIN' && payload.rol !== 'USUARIO')
  ) {
    throw new Error('Token con formato inesperado');
  }
  return { id: payload.id, rol: payload.rol };
}
