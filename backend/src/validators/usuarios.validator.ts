import { z } from 'zod';

const nombre = z
  .string({ error: 'El nombre es obligatorio' })
  .trim()
  .min(2, 'El nombre debe tener entre 2 y 100 caracteres')
  .max(100, 'El nombre debe tener entre 2 y 100 caracteres');

// Se guarda en minúsculas: el correo no distingue mayúsculas (D-04)
const correo = z
  .string({ error: 'El correo es obligatorio' })
  .trim()
  .toLowerCase()
  .min(1, 'El correo es obligatorio')
  .max(120, 'El correo no puede pasar de 120 caracteres')
  .pipe(z.email('El correo no es válido'));

// bcrypt solo considera los primeros 72 caracteres
const password = z
  .string({ error: 'La contraseña es obligatoria' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña no puede pasar de 72 caracteres');

const rol = z.enum(['ADMIN', 'USUARIO'], { error: 'El rol debe ser ADMIN o USUARIO' });

const activo = z.boolean({ error: 'El estado activo debe ser verdadero o falso' });

export const esquemaCrearUsuario = z.object({
  nombre,
  correo,
  password,
  rol,
  activo: activo.default(true),
});

export type DatosCrearUsuario = z.infer<typeof esquemaCrearUsuario>;

/**
 * Al editar todo es opcional. Una contraseña vacía significa "no cambiarla",
 * que es lo que envía el formulario cuando el campo se deja en blanco.
 */
export const esquemaActualizarUsuario = z.object({
  nombre: nombre.optional(),
  correo: correo.optional(),
  password: z
    .string({ error: 'La contraseña debe ser texto' })
    .optional()
    .transform((valor) => (valor === '' ? undefined : valor))
    .pipe(password.optional()),
  rol: rol.optional(),
  activo: activo.optional(),
});

export type DatosActualizarUsuario = z.infer<typeof esquemaActualizarUsuario>;

export const esquemaFiltrosUsuarios = z.object({
  q: z
    .string()
    .trim()
    .optional()
    .transform((valor) => (valor ? valor : undefined)),
  rol: z.enum(['ADMIN', 'USUARIO'], { error: 'El rol debe ser ADMIN o USUARIO' }).optional(),
});

export type FiltrosUsuarios = z.infer<typeof esquemaFiltrosUsuarios>;
