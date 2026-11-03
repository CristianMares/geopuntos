import { UsuarioSesion } from './usuario';

export interface CredencialesLogin {
  correo: string;
  password: string;
}

export interface RespuestaLogin {
  token: string;
  usuario: UsuarioSesion;
}

/** Forma de los errores que devuelve la API */
export interface ErrorApi {
  mensaje?: string;
  errores?: string[];
}
