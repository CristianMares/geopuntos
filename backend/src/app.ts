import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { manejarErrores, rutaNoEncontrada } from './middlewares/errores';
import routes from './routes';

export const app = express();

app.use(cors({ origin: env.CORS_ORIGINS }));
// El límite por defecto (100 kB) se queda corto para importar hasta 500 puntos de un CSV
app.use(express.json({ limit: '1mb' }));

app.use('/api', routes);

app.use(rutaNoEncontrada);
app.use(manejarErrores);
