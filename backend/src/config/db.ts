import { Pool } from 'pg';
import { env } from './env';

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
  max: 10,
});

export async function verificarConexion(): Promise<void> {
  const { rows } = await pool.query<{ ahora: Date }>('SELECT NOW() AS ahora');
  console.log(`Base de datos conectada (${rows[0]?.ahora.toISOString()})`);
}
