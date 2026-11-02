import type { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service';
import { validar } from '../utils/validar';

const esquemaLogin = z.object({
  correo: z
    .string({ error: 'El correo es obligatorio' })
    .trim()
    .min(1, 'El correo es obligatorio')
    .pipe(z.email('El correo no es válido')),
  password: z
    .string({ error: 'La contraseña es obligatoria' })
    .min(1, 'La contraseña es obligatoria'),
});

export async function login(req: Request, res: Response): Promise<void> {
  const validacion = validar(esquemaLogin, req.body);
  if (!validacion.ok) {
    res.status(400).json({ errores: validacion.errores });
    return;
  }

  const { correo, password } = validacion.datos;
  const resultado = await authService.verificarCredenciales(correo, password);

  if (!resultado.ok) {
    const mensaje =
      resultado.motivo === 'INACTIVO'
        ? 'Tu cuenta está inactiva. Contacta a un administrador'
        : 'Correo o contraseña incorrectos';
    res.status(401).json({ mensaje });
    return;
  }

  const { usuario } = resultado;
  res.status(200).json({
    token: authService.generarToken(usuario),
    usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
  });
}

/** Devuelve la sesión vigente; el frontend la usa al recargar la página */
export async function perfil(req: Request, res: Response): Promise<void> {
  // req.usuario lo deja el middleware de autenticación
  const sesion = req.usuario;
  if (!sesion) {
    res.status(401).json({ mensaje: 'No autenticado' });
    return;
  }
  const usuario = await authService.buscarPorId(sesion.id);
  if (!usuario) {
    res.status(401).json({ mensaje: 'La sesión ya no es válida' });
    return;
  }
  res.status(200).json({
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
  });
}
