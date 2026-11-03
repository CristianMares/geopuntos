import { app } from './app';
import { verificarConexion } from './config/db';
import { env } from './config/env';

async function iniciar(): Promise<void> {
  await verificarConexion();
  app.listen(env.PORT, () => {
    console.log(`API escuchando en http://localhost:${env.PORT}/api`);
  });
}

iniciar().catch((error: unknown) => {
  console.error('No se pudo iniciar la API:', error);
  process.exit(1);
});
