import { HttpErrorResponse } from '@angular/common/http';
import { ErrorApi } from '../models/auth';

/** Convierte cualquier error de una petición en un texto para mostrar al usuario */
export function mensajeError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Ocurrió un error inesperado';
  }
  if (error.status === 0) {
    return 'No se pudo conectar con el servidor';
  }

  const cuerpo = error.error as ErrorApi | null;
  if (cuerpo?.errores?.length) {
    return cuerpo.errores.join('. ');
  }
  if (cuerpo?.mensaje) {
    return cuerpo.mensaje;
  }
  return 'Ocurrió un error en el servidor';
}
