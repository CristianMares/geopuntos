import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

router.get('/salud', (_req, res) => {
  res.status(200).json({ estado: 'ok' });
});

router.use('/auth', authRoutes);

export default router;
