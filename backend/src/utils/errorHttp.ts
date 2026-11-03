export type CuerpoError = { mensaje: string } | { errores: string[] };

/**
 * Error que ya sabe con qué código HTTP y cuerpo responder.
 * Los servicios y controladores lo lanzan; el manejador de errores lo traduce.
 */
export class ErrorHttp extends Error {
  constructor(
    public readonly estado: number,
    public readonly cuerpo: CuerpoError,
  ) {
    super('mensaje' in cuerpo ? cuerpo.mensaje : cuerpo.errores.join('; '));
  }

  static noEncontrado(recurso: string): ErrorHttp {
    return new ErrorHttp(404, { mensaje: `${recurso} no encontrado` });
  }

  static conflicto(mensaje: string): ErrorHttp {
    return new ErrorHttp(409, { mensaje });
  }

  static invalido(...errores: string[]): ErrorHttp {
    return new ErrorHttp(400, { errores });
  }
}
