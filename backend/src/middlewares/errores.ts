import type { NextFunction, Request, Response } from 'express';
import { ErrorHttp } from '../utils/errorHttp';

export function rutaNoEncontrada(req: Request, res: Response): void {
  res.status(404).json({ mensaje: `Ruta no encontrada: ${req.method} ${req.path}` });
}

interface ErrorConTipo extends Error {
  type?: string;
}

export function manejarErrores(
  error: ErrorConTipo,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ErrorHttp) {
    res.status(error.estado).json(error.cuerpo);
    return;
  }

  // JSON mal formado en el cuerpo de la petición
  if (error.type === 'entity.parse.failed') {
    res.status(400).json({ errores: ['El cuerpo de la petición no es un JSON válido'] });
    return;
  }

  console.error(error);
  res.status(500).json({ mensaje: 'Error interno del servidor' });
}
