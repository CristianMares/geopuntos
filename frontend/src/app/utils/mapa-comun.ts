import { Feature } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import { Point, Polygon } from 'ol/geom';
import { circular } from 'ol/geom/Polygon';
import { Tile as CapaTesela, Vector as CapaVectorial } from 'ol/layer';
import { fromLonLat } from 'ol/proj';
import { OSM, Vector as FuenteVectorial, XYZ } from 'ol/source';
import { Circle as EstiloCirculo, Fill, Stroke, Style } from 'ol/style';
import type { FeatureLike } from 'ol/Feature';
import LayerSwitcher from 'ol-ext/control/LayerSwitcher';

/** Piezas de OpenLayers que comparten la pantalla del mapa y la del formulario de punto */

export const ZOOM_MI_UBICACION = 16;

/** Imágenes satelitales de Esri: gratuitas para un uso ligero, pidiendo atribución */
const URL_SATELITE =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ATRIBUCION_SATELITE = 'Imágenes © Esri, Maxar, Earthstar Geographics';

const COLOR_UBICACION = '#1565a6';

export interface CapasBase {
  calles: CapaTesela;
  satelite: CapaTesela;
}

/** Capas base: el selector de ol-ext las reconoce por "baseLayer" y muestra su "title" */
export function crearCapasBase(): CapasBase {
  return {
    calles: new CapaTesela({
      source: new OSM(),
      properties: { title: 'Calles', baseLayer: true },
    }),
    satelite: new CapaTesela({
      visible: false,
      source: new XYZ({ url: URL_SATELITE, maxZoom: 19, attributions: ATRIBUCION_SATELITE }),
      properties: { title: 'Satélite', baseLayer: true },
    }),
  };
}

export function crearSelectorDeCapas(): LayerSwitcher {
  return new LayerSwitcher({
    tipLabel: 'Capas del mapa',
    reverse: true,
    trash: false,
    extent: false,
  });
}

export interface UbicacionUsuario {
  longitud: number;
  latitud: number;
  /** Radio de incertidumbre, en metros */
  precision: number;
}

function mensajeUbicacion(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Permiso de ubicación denegado. Actívalo en el navegador para usar esta función';
    case error.POSITION_UNAVAILABLE:
      return 'No se pudo determinar tu ubicación';
    case error.TIMEOUT:
      return 'Se agotó el tiempo esperando tu ubicación. Inténtalo de nuevo';
    default:
      return 'No se pudo obtener tu ubicación';
  }
}

/**
 * Pide la ubicación al navegador, que antes pregunta a la persona si lo permite.
 * Si algo falla, rechaza con un Error cuyo mensaje ya está listo para mostrarse.
 */
export function obtenerUbicacion(): Promise<UbicacionUsuario> {
  return new Promise((resolver, rechazar) => {
    if (!('geolocation' in navigator)) {
      rechazar(new Error('Tu navegador no permite obtener la ubicación'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolver({
          longitud: coords.longitude,
          latitud: coords.latitude,
          precision: coords.accuracy,
        }),
      (error) => rechazar(new Error(mensajeUbicacion(error))),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  });
}

function estiloUbicacion(feature: FeatureLike): Style {
  if (feature.get('tipo') === 'precision') {
    return new Style({
      fill: new Fill({ color: 'rgba(21, 101, 166, 0.12)' }),
      stroke: new Stroke({ color: 'rgba(21, 101, 166, 0.45)', width: 1 }),
    });
  }
  return new Style({
    image: new EstiloCirculo({
      radius: 8,
      fill: new Fill({ color: COLOR_UBICACION }),
      stroke: new Stroke({ color: '#ffffff', width: 3 }),
    }),
  });
}

export interface CapaDeUbicacion {
  capa: CapaVectorial;
  /** Dibuja la marca azul con su círculo de precisión y devuelve el centro en coordenadas del mapa */
  marcar: (ubicacion: UbicacionUsuario) => Coordinate;
}

export function crearCapaDeUbicacion(): CapaDeUbicacion {
  const fuente = new FuenteVectorial<Feature<Point | Polygon>>();
  const capa = new CapaVectorial({
    source: fuente,
    zIndex: 5,
    style: (feature) => estiloUbicacion(feature),
    properties: { displayInLayerSwitcher: false },
  });

  return {
    capa,
    marcar: ({ longitud, latitud, precision }) => {
      const centro = fromLonLat([longitud, latitud]);
      const circulo = circular([longitud, latitud], precision, 64).transform(
        'EPSG:4326',
        'EPSG:3857',
      ) as Polygon;
      fuente.clear();
      fuente.addFeatures([
        new Feature<Polygon>({ geometry: circulo, tipo: 'precision' }),
        new Feature<Point>({ geometry: new Point(centro), tipo: 'posicion' }),
      ]);
      return centro;
    },
  };
}
