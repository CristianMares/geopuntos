import { Router } from 'express';
import * as usuariosController from '../controllers/usuarios.controller';

const router = Router();

router.get('/', usuariosController.listar);
router.post('/', usuariosController.crear);
router.put('/:id', usuariosController.actualizar);
router.delete('/:id', usuariosController.eliminar);

export default router;
