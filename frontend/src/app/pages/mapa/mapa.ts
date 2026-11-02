import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { forkJoin } from 'rxjs';
import { Feature, Map, Overlay, View } from 'ol';
import { ScaleLine, defaults as controlesPorDefecto } from 'ol/control';
import { boundingExtent } from 'ol/extent';
import { Point } from 'ol/geom';
import { Tile as CapaTesela, Vector as CapaVectorial } from 'ol/layer';
import { fromLonLat } from 'ol/proj';
import { OSM, Vector as FuenteVectorial } from 'ol/source';
import { Circle as EstiloCirculo, Fill, Stroke, Style } from 'ol/style';
import type { FeatureLike } from 'ol/Feature';
import { Categoria } from '../../models/categoria';
import { Punto } from '../../models/punto';
import { CategoriasService } from '../../services/categorias.service';
import { PuntosService } from '../../services/puntos.service';
import { mensajeError } from '../../utils/errores';

/** Centro inicial (Ciudad de México) mientras no hay puntos que encuadrar */
const CENTRO_INICIAL = fromLonLat([-99.1332, 19.4326]);
const ZOOM_AL_ELEGIR = 15;

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.html',
  styleUrl: './mapa.scss',
})
export class Mapa implements OnInit, AfterViewInit, OnDestroy {
  private readonly puntosService = inject(PuntosService);
  private readonly categoriasService = inject(CategoriasService);

  private readonly contenedor = viewChild.required<ElementRef<HTMLDivElement>>('contenedor');
  private readonly ventana = viewChild.required<ElementRef<HTMLDivElement>>('ventana');

  protected readonly puntos = signal<Punto[]>([]);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly busqueda = signal('');
  protected readonly categoriaId = signal<number | null>(null);
  protected readonly seleccionadoId = signal<number | null>(null);

  /** La búsqueda y el filtro de categoría afectan a la lista y al mapa a la vez */
  protected readonly filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const categoria = this.categoriaId();
    return this.puntos().filter(
      (p) =>
        (categoria === null || p.categoria.id === categoria) &&
        (texto === '' || p.nombre.toLowerCase().includes(texto)),
    );
  });

  protected readonly seleccionado = computed(
    () => this.filtrados().find((p) => p.id === this.seleccionadoId()) ?? null,
  );

  private mapa?: Map;
  private overlay?: Overlay;
  private readonly fuente = new FuenteVectorial<Feature<Point>>();
  private readonly capa = new CapaVectorial({ source: this.fuente, style: (f) => this.estilo(f) });
  private readonly estilos = new globalThis.Map<string, Style[]>();
  private encuadrado = false;

  constructor() {
    // Cada vez que cambia lo filtrado o la selección, el mapa se redibuja
    effect(() => {
      const visibles = this.filtrados();
      const elegido = this.seleccionadoId();
      this.sincronizar(visibles, elegido);
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  ngAfterViewInit(): void {
    this.overlay = new Overlay({
      element: this.ventana().nativeElement,
      positioning: 'bottom-center',
      offset: [0, -16],
      autoPan: { animation: { duration: 250 } },
    });

    this.mapa = new Map({
      target: this.contenedor().nativeElement,
      layers: [new CapaTesela({ source: new OSM() }), this.capa],
      overlays: [this.overlay],
      controls: controlesPorDefecto({ rotate: false }).extend([new ScaleLine({ units: 'metric' })]),
      view: new View({ center: CENTRO_INICIAL, zoom: 11 }),
    });

    this.mapa.on('singleclick', (evento) => {
      const feature = this.mapa?.forEachFeatureAtPixel(evento.pixel, (f) => f, {
        layerFilter: (capa) => capa === this.capa,
      });
      const punto = feature?.get('punto') as Punto | undefined;
      this.seleccionadoId.set(punto?.id ?? null);
    });

    this.mapa.on('pointermove', (evento) => {
      const sobrePunto = this.mapa?.hasFeatureAtPixel(evento.pixel, {
        layerFilter: (capa) => capa === this.capa,
      });
      const destino = this.mapa?.getTargetElement();
      if (destino) destino.style.cursor = sobrePunto ? 'pointer' : '';
    });

    this.sincronizar(this.filtrados(), this.seleccionadoId());
    // Si los datos llegaron antes de que existiera el mapa, se encuadra ahora
    this.encuadrarTodos();
  }

  ngOnDestroy(): void {
    // Libera el mapa y sus listeners al salir de la pantalla
    this.mapa?.setTarget(undefined);
    this.mapa = undefined;
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    forkJoin({
      puntos: this.puntosService.listar(),
      categorias: this.categoriasService.listar(),
    }).subscribe({
      next: ({ puntos, categorias }) => {
        this.puntos.set(puntos);
        this.categorias.set(categorias);
        this.cargando.set(false);
        this.encuadrarTodos();
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeError(error));
      },
    });
  }

  protected elegir(punto: Punto): void {
    this.seleccionadoId.set(punto.id);
    // Centra con animación; no aleja el zoom si el usuario ya estaba más cerca
    const vista = this.mapa?.getView();
    vista?.animate({
      center: fromLonLat([punto.longitud, punto.latitud]),
      zoom: Math.max(vista.getZoom() ?? 0, ZOOM_AL_ELEGIR),
      duration: 600,
    });
  }

  protected cerrarVentana(): void {
    this.seleccionadoId.set(null);
  }

  protected alCambiarCategoria(valor: string): void {
    this.categoriaId.set(valor === '' ? null : Number(valor));
  }

  /** Vuelca los puntos visibles en la capa y coloca la ventana sobre el elegido */
  private sincronizar(visibles: Punto[], elegidoId: number | null): void {
    if (!this.mapa) return;

    this.fuente.clear();
    this.fuente.addFeatures(
      visibles.map((punto) => {
        const feature = new Feature({
          geometry: new Point(fromLonLat([punto.longitud, punto.latitud])),
          punto,
        });
        feature.setId(punto.id);
        return feature;
      }),
    );

    const elegido = visibles.find((p) => p.id === elegidoId);
    this.overlay?.setPosition(
      elegido ? fromLonLat([elegido.longitud, elegido.latitud]) : undefined,
    );
  }

  /** La primera vez, ajusta la vista para que se vean todos los puntos */
  private encuadrarTodos(): void {
    if (this.encuadrado || !this.mapa || this.puntos().length === 0) return;
    this.encuadrado = true;
    const coordenadas = this.puntos().map((p) => fromLonLat([p.longitud, p.latitud]));
    this.mapa
      .getView()
      .fit(boundingExtent(coordenadas), { padding: [70, 70, 70, 70], maxZoom: 15, duration: 400 });
  }

  /** Color de la categoría; el elegido es más grande y lleva borde con halo */
  private estilo(feature: FeatureLike): Style[] {
    const punto = feature.get('punto') as Punto;
    const elegido = punto.id === this.seleccionadoId();
    const clave = `${punto.categoria.color}|${elegido}`;

    let estilos = this.estilos.get(clave);
    if (!estilos) {
      const base = new Style({
        image: new EstiloCirculo({
          radius: elegido ? 11 : 7,
          fill: new Fill({ color: punto.categoria.color }),
          stroke: new Stroke({ color: '#ffffff', width: elegido ? 4 : 2 }),
        }),
        zIndex: elegido ? 2 : 1,
      });
      estilos = elegido
        ? [
            new Style({
              image: new EstiloCirculo({
                radius: 18,
                fill: new Fill({ color: 'rgba(21, 101, 166, 0.22)' }),
              }),
              zIndex: 1,
            }),
            base,
          ]
        : [base];
      this.estilos.set(clave, estilos);
    }
    return estilos;
  }
}
