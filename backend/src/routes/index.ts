import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar';
import { requiereRol } from '../middlewares/requiereRol';
import authRoutes from './auth.routes';
import categoriasRoutes from './categorias.routes';
import puntosRoutes from './puntos.routes';
import usuariosRoutes from './usuarios.routes';

const router = Router();

// Rutas públicas
router.get('/salud', (_req, res) => {
  res.status(200).json({ estado: 'ok' });
});
router.use('/auth', authRoutes);

// Rutas que exigen sesión
router.use('/categorias', autenticar, categoriasRoutes);
router.use('/puntos', autenticar, puntosRoutes);

// Solo administradores
router.use('/usuarios', autenticar, requiereRol('ADMIN'), usuariosRoutes);

export default router;
