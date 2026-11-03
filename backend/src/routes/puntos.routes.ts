import { Router } from 'express';
import * as puntosController from '../controllers/puntos.controller';

const router = Router();

router.get('/', puntosController.listar);
router.post('/importar', puntosController.importar);
router.get('/:id', puntosController.obtener);
router.post('/', puntosController.crear);
router.put('/:id', puntosController.actualizar);
router.delete('/:id', puntosController.eliminar);

export default router;
