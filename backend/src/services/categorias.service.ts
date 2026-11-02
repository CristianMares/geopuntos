import { pool } from '../config/db';
import type { Categoria } from '../types';

export async function listar(): Promise<Categoria[]> {
  const { rows } = await pool.query<Categoria>(
    'SELECT id, nombre, color FROM categorias ORDER BY id',
  );
  return rows;
}
