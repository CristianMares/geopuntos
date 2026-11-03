import type { NextFunction, Request, Response } from 'express';
import type { Rol } from '../types';

/** Se usa después de "autenticar". Responde 403 si el rol no está permitido */
export function requiereRol(...rolesPermitidos: Rol[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const rol = req.usuario?.rol;
    if (!rol || !rolesPermitidos.includes(rol)) {
      res.status(403).json({ mensaje: 'No tienes permiso para esta acción' });
      return;
    }
    next();
  };
}
