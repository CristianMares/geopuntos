import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { autenticar } from '../middlewares/autenticar';

const router = Router();

router.post('/login', authController.login);
router.get('/perfil', autenticar, authController.perfil);

export default router;
