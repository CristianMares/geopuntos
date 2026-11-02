import type { SesionUsuario } from './index';

declare global {
  namespace Express {
    interface Request {
      usuario?: SesionUsuario;
    }
  }
}

export {};
