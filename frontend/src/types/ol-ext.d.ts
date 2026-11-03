/**
 * ol-ext no incluye tipos de TypeScript. Solo se declara lo que la aplicación usa.
 */
declare module 'ol-ext/control/LayerSwitcher' {
  import Control from 'ol/control/Control';

  export interface OpcionesLayerSwitcher {
    /** Texto del botón al pasar el cursor */
    tipLabel?: string;
    /** Muestra las capas de arriba hacia abajo según su orden en el mapa */
    reverse?: boolean;
    /** Arranca con el panel plegado */
    collapsed?: boolean;
    /** Botón para eliminar capas (no se usa) */
    trash?: boolean;
    /** Opción para encuadrar la extensión de cada capa (no se usa) */
    extent?: boolean;
    mouseover?: boolean;
    noScroll?: boolean;
  }

  export default class LayerSwitcher extends Control {
    constructor(opciones?: OpcionesLayerSwitcher);
  }
}
