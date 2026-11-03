import type { Request, Response } from 'express';
import * as usuariosService from '../services/usuarios.service';
import { ErrorHttp } from '../utils/errorHttp';
import { exigir, leerId } from '../utils/validar';
import {
  esquemaActualizarUsuario,
  esquemaCrearUsuario,
  esquemaFiltrosUsuarios,
} from '../validators/usuarios.validator';

export async function listar(req: Request, res: Response): Promise<void> {
  const filtros = exigir(esquemaFiltrosUsuarios, req.query);
  res.status(200).json(await usuariosService.listar(filtros));
}

export async function crear(req: Request, res: Response): Promise<void> {
  const datos = exigir(esquemaCrearUsuario, req.body);
  res.status(201).json(await usuariosService.crear(datos));
}

export async function actualizar(req: Request, res: Response): Promise<void> {
  const id = leerId(req.params['id']);
  const datos = exigir(esquemaActualizarUsuario, req.body);

  // Un administrador no puede quitarse el acceso a sí mismo (D-14)
  if (id === req.usuario?.id) {
    if (datos.activo === false) {
      throw ErrorHttp.invalido('No puedes desactivar tu propia cuenta');
    }
    if (datos.rol !== undefined && datos.rol !== 'ADMIN') {
      throw ErrorHttp.invalido('No puedes quitarte el rol de administrador');
    }
  }

  res.status(200).json(await usuariosService.actualizar(id, datos));
}

export async function eliminar(req: Request, res: Response): Promise<void> {
  const id = leerId(req.params['id']);
  if (id === req.usuario?.id) {
    throw ErrorHttp.invalido('No puedes eliminar tu propia cuenta');
  }
  await usuariosService.eliminar(id);
  res.status(204).send();
}
