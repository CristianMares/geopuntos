import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

// El .env vive en la raíz del repositorio y lo comparten docker-compose y la API
dotenv.config({ path: path.resolve(__dirname, '../../../.env'), quiet: true });

const esquema = z.object({
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive(),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
  // Servicios como Neon exigen SSL
  DB_SSL: z.enum(['true', 'false']).default('false'),
  PORT: z.coerce.number().int().positive().default(3000),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  // Varios orígenes separados por coma
  CORS_ORIGIN: z.string().min(1),
});

const resultado = esquema.safeParse(process.env);

if (!resultado.success) {
  const detalle = resultado.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  console.error(`Variables de entorno inválidas o faltantes:\n${detalle}`);
  process.exit(1);
}

export const env = {
  ...resultado.data,
  DB_SSL: resultado.data.DB_SSL === 'true',
  CORS_ORIGINS: resultado.data.CORS_ORIGIN.split(',').map((o) => o.trim()),
};
