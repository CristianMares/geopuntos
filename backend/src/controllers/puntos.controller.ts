import type { Request, Response } from 'express';
import * as puntosService from '../services/puntos.service';
import { ErrorHttp } from '../utils/errorHttp';
import { exigir, leerId, validar } from '../utils/validar';
import {
  type DatosPunto,
  esquemaCargaImportacion,
  esquemaFiltrosPuntos,
  esquemaPunto,
} from '../validators/puntos.validator';

const MAX_ERRORES_MOSTRADOS = 50;

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

/** Importa varios puntos de una vez; si alguna fila es inválida no se inserta ninguna */
export async function importar(req: Request, res: Response): Promise<void> {
  const { puntos } = exigir(esquemaCargaImportacion, req.body);

  const validos: DatosPunto[] = [];
  const errores: string[] = [];
  puntos.forEach((fila, indice) => {
    const resultado = validar(esquemaPunto, fila);
    if (resultado.ok) validos.push(resultado.datos);
    else errores.push(...resultado.errores.map((mensaje) => `Fila ${indice + 1}: ${mensaje}`));
  });
  if (errores.length > 0) throw ErrorHttp.invalido(...errores.slice(0, MAX_ERRORES_MOSTRADOS));

  const usuarioId = req.usuario?.id ?? 0;
  const importados = await puntosService.importar(validos, usuarioId);
  res.status(201).json({ importados });
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
