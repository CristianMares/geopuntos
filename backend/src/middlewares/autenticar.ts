import type { NextFunction, Request, Response } from 'express';
import { TokenExpiredError } from 'jsonwebtoken';
import * as authService from '../services/auth.service';

/**
 * Exige un token válido en "Authorization: Bearer <token>".
 * Además consulta al usuario en la base: si lo desactivaron, lo eliminaron o le
 * cambiaron el rol, el cambio aplica de inmediato sin esperar a que venza el token.
 */
export async function autenticar(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const encabezado = req.header('Authorization');
  const [esquema, token] = encabezado?.split(' ') ?? [];

  if (esquema !== 'Bearer' || !token) {
    res.status(401).json({ mensaje: 'Se requiere iniciar sesión' });
    return;
  }

  try {
    const sesion = authService.verificarToken(token);
    const usuario = await authService.buscarPorId(sesion.id);

    if (!usuario || !usuario.activo) {
      res.status(401).json({ mensaje: 'La sesión ya no es válida' });
      return;
    }

    req.usuario = { id: usuario.id, rol: usuario.rol };
    next();
  } catch (error) {
    const mensaje =
      error instanceof TokenExpiredError
        ? 'La sesión expiró, inicia sesión de nuevo'
        : 'Token inválido';
    res.status(401).json({ mensaje });
  }
}
