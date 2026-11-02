import type { Request, Response } from 'express';
import * as puntosService from '../services/puntos.service';
import { exigir, leerId } from '../utils/validar';
import { esquemaFiltrosPuntos, esquemaPunto } from '../validators/puntos.validator';

export async function listar(req: Request, res: Response): Promise<void> {
  const filtros = exigir(esquemaFiltrosPuntos, req.query);
  res.status(200).json(await puntosService.listar(filtros));
}

export async function obtener(req: Request, res: Response): Promise<void> {
  res.status(200).json(await puntosService.obtener(leerId(req.params['id'])));
}

export async function crear(req: Request, res: Response): Promise<void> {
  const datos = exigir(esquemaPunto, req.body);
  // El dueño del punto sale del token, nunca del cuerpo de la petición
  const usuarioId = req.usuario?.id ?? 0;
  res.status(201).json(await puntosService.crear(datos, usuarioId));
}

export async function actualizar(req: Request, res: Response): Promise<void> {
  const id = leerId(req.params['id']);
  const datos = exigir(esquemaPunto, req.body);
  res.status(200).json(await puntosService.actualizar(id, datos));
}

export async function eliminar(req: Request, res: Response): Promise<void> {
  await puntosService.eliminar(leerId(req.params['id']));
  res.status(204).send();
}
