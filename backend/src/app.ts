import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { manejarErrores, rutaNoEncontrada } from './middlewares/errores';
import routes from './routes';

export const app = express();

app.use(cors({ origin: env.CORS_ORIGINS }));
app.use(express.json());

app.use('/api', routes);

app.use(rutaNoEncontrada);
app.use(manejarErrores);
