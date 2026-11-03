export type Rol = 'ADMIN' | 'USUARIO';

/** Usuario completo, tal como lo devuelve /api/usuarios */
export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  activo: boolean;
  totalPuntos: number;
  creadoEn: string;
  actualizadoEn: string;
}

/** Datos mínimos de quien tiene la sesión iniciada */
export interface UsuarioSesion {
  id: number;
  nombre: string;
  rol: Rol;
}

export interface DatosUsuario {
  nombre: string;
  correo: string;
  rol: Rol;
  activo: boolean;
  password?: string;
}
