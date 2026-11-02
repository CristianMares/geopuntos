import type { Request, Response } from 'express';
import * as categoriasService from '../services/categorias.service';

export async function listar(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await categoriasService.listar());
}
