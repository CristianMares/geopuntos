export type Rol = 'ADMIN' | 'USUARIO';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  activo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}

/** Solo se usa dentro del servicio de autenticación; nunca sale por la API */
export interface UsuarioConHash extends Usuario {
  passwordHash: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  color: string;
}

export interface Punto {
  id: number;
  nombre: string;
  descripcion: string | null;
  latitud: number;
  longitud: number;
  categoriaId: number;
  usuarioId: number;
  creadoEn: Date;
  actualizadoEn: Date;
}

/** Datos del usuario que viajan dentro del token y en req.usuario */
export interface SesionUsuario {
  id: number;
  rol: Rol;
}

export interface ErrorValidacion {
  errores: string[];
}
