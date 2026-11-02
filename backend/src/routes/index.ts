import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar';
import authRoutes from './auth.routes';
import categoriasRoutes from './categorias.routes';
import puntosRoutes from './puntos.routes';

const router = Router();

// Rutas públicas
router.get('/salud', (_req, res) => {
  res.status(200).json({ estado: 'ok' });
});
router.use('/auth', authRoutes);

// Rutas que exigen sesión
router.use('/categorias', autenticar, categoriasRoutes);
router.use('/puntos', autenticar, puntosRoutes);

export default router;
