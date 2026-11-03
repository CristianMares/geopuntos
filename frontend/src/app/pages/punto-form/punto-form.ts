import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Feature, Map, View } from 'ol';
import { Control, ScaleLine, defaults as controlesPorDefecto } from 'ol/control';
import { Point } from 'ol/geom';
import { Vector as CapaVectorial } from 'ol/layer';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Vector as FuenteVectorial } from 'ol/source';
import { Circle as EstiloCirculo, Fill, Stroke, Style } from 'ol/style';
import { forkJoin, of } from 'rxjs';
import { Categoria } from '../../models/categoria';
import { DatosPunto, Punto } from '../../models/punto';
import { CategoriasService } from '../../services/categorias.service';
import { PuntosService } from '../../services/puntos.service';
import { ToastService } from '../../services/toast.service';
import { mensajeError } from '../../utils/errores';
import {
  UbicacionUsuario,
  ZOOM_MI_UBICACION,
  crearCapaDeUbicacion,
  crearCapasBase,
  crearSelectorDeCapas,
  obtenerUbicacion,
} from '../../utils/mapa-comun';

const CENTRO_INICIAL = fromLonLat([-99.1332, 19.4326]);
const ZOOM_INICIAL = 11;
const ZOOM_CON_PUNTO = 15;
const COLOR_SIN_CATEGORIA = '#1565a6';

type Campo = 'nombre' | 'categoriaId' | 'descripcion' | 'latitud' | 'longitud';

/** Redondea a 6 decimales, que es la precisión que guarda la base de datos */
function redondear(valor: number): number {
  return Math.round(valor * 1e6) / 1e6;
}

/** Si el mapa se arrastró más allá del antimeridiano, devuelve la longitud a [-180, 180] */
function normalizarLongitud(longitud: number): number {
  return ((((longitud + 180) % 360) + 360) % 360) - 180;
}

@Component({
  selector: 'app-punto-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './punto-form.html',
  styleUrl: './punto-form.scss',
})
export class PuntoForm implements OnInit, AfterViewInit, OnDestroy {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly puntosService = inject(PuntosService);
  private readonly categoriasService = inject(CategoriasService);
  private readonly toast = inject(ToastService);
  private readonly detector = inject(ChangeDetectorRef);
  private readonly destruccion = inject(DestroyRef);

  private readonly contenedor = viewChild.required<ElementRef<HTMLDivElement>>('contenedor');
  private readonly herramientas = viewChild.required<ElementRef<HTMLDivElement>>('herramientas');

  /** Con :id en la ruta el formulario edita; sin él, crea */
  private readonly idEdicion = Number(this.ruta.snapshot.paramMap.get('id')) || null;
  protected readonly esEdicion = this.idEdicion !== null;

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly ubicando = signal(false);
  /** Última ubicación obtenida del navegador; permite usarla como coordenadas del punto */
  private readonly ultimaUbicacion = signal<UbicacionUsuario | null>(null);
  protected readonly hayUbicacion = computed(() => this.ultimaUbicacion() !== null);
  private readonly categoriaElegida = signal<number | null>(null);

  protected readonly formulario = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
    }),
    categoriaId: new FormControl<number | null>(null, [Validators.required]),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(1000)],
    }),
    latitud: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(-90),
      Validators.max(90),
    ]),
    longitud: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(-180),
      Validators.max(180),
    ]),
  });

  private readonly colorMarca = computed(
    () =>
      this.categorias().find((c) => c.id === this.categoriaElegida())?.color ?? COLOR_SIN_CATEGORIA,
  );

  private mapa?: Map;
  private observador?: ResizeObserver;
  private readonly fuente = new FuenteVectorial<Feature<Point>>();
  private readonly capa = new CapaVectorial({
    source: this.fuente,
    style: () => this.estiloMarca(),
    properties: { displayInLayerSwitcher: false },
  });
  // Mismas capas base y misma marca de ubicación que la pantalla del mapa
  private readonly capasBase = crearCapasBase();
  private readonly ubicacion = crearCapaDeUbicacion();

  constructor() {
    // Si se escriben las coordenadas a mano, la marca se mueve en el mapa
    this.formulario.valueChanges.pipe(takeUntilDestroyed(this.destruccion)).subscribe((valores) => {
      this.categoriaElegida.set(valores.categoriaId ?? null);
      this.capa.changed();
    });
    this.formulario.controls.latitud.valueChanges
      .pipe(takeUntilDestroyed(this.destruccion))
      .subscribe(() => this.moverMarcaDesdeFormulario());
    this.formulario.controls.longitud.valueChanges
      .pipe(takeUntilDestroyed(this.destruccion))
      .subscribe(() => this.moverMarcaDesdeFormulario());
  }

  ngOnInit(): void {
    const punto$ = this.idEdicion === null ? of(null) : this.puntosService.obtener(this.idEdicion);
    forkJoin({ categorias: this.categoriasService.listar(), punto: punto$ }).subscribe({
      next: ({ categorias, punto }) => {
        this.categorias.set(categorias);
        if (punto) this.llenarFormulario(punto);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.toast.error(mensajeError(error));
        void this.router.navigate(['/puntos']);
      },
    });
  }

  ngAfterViewInit(): void {
    this.mapa = new Map({
      target: this.contenedor().nativeElement,
      layers: [this.capasBase.calles, this.capasBase.satelite, this.capa, this.ubicacion.capa],
      controls: controlesPorDefecto({
        rotate: false,
        zoomOptions: { zoomInTipLabel: 'Acercar', zoomOutTipLabel: 'Alejar' },
      }).extend([
        new ScaleLine({ units: 'metric' }),
        // Los botones propios son un control más, para que el panel de capas se abra por encima
        new Control({ element: this.herramientas().nativeElement }),
        crearSelectorDeCapas(),
      ]),
      view: new View({ center: CENTRO_INICIAL, zoom: ZOOM_INICIAL }),
    });

    this.mapa.on('singleclick', (evento) => {
      const [longitud, latitud] = toLonLat(evento.coordinate);
      this.fijarDesdeMapa(redondear(latitud), redondear(normalizarLongitud(longitud)));
    });

    // El mapa ocupa todo el alto disponible: si el contenedor cambia de tamaño, se reajusta
    this.observador = new ResizeObserver(() => this.mapa?.updateSize());
    this.observador.observe(this.contenedor().nativeElement);

    // Si los datos de edición llegaron antes que el mapa, se coloca la marca ahora
    this.moverMarcaDesdeFormulario(ZOOM_CON_PUNTO);
  }

  ngOnDestroy(): void {
    // Libera el mapa y sus listeners al salir de la pantalla
    this.observador?.disconnect();
    this.mapa?.setTarget(undefined);
    this.mapa = undefined;
  }

  protected mensaje(campo: Campo): string | null {
    const control = this.formulario.controls[campo];
    if (!(control.touched || control.dirty) || !control.errors) return null;

    switch (campo) {
      case 'nombre':
        return control.hasError('required')
          ? 'El nombre es obligatorio'
          : 'El nombre debe tener entre 3 y 100 caracteres';
      case 'categoriaId':
        return 'La categoría es obligatoria';
      case 'descripcion':
        return 'La descripción no puede pasar de 1000 caracteres';
      case 'latitud':
        return control.hasError('required')
          ? 'La latitud es obligatoria'
          : 'La latitud debe estar entre -90 y 90';
      case 'longitud':
        return control.hasError('required')
          ? 'La longitud es obligatoria'
          : 'La longitud debe estar entre -180 y 180';
    }
  }

  /** Va a la ubicación de la persona y deja la marca azul; el punto del formulario no cambia */
  protected async irAMiUbicacion(): Promise<void> {
    this.ubicando.set(true);
    try {
      const ubicacion = await obtenerUbicacion();
      this.ultimaUbicacion.set(ubicacion);
      const centro = this.ubicacion.marcar(ubicacion);
      const vista = this.mapa?.getView();
      vista?.animate({
        center: centro,
        zoom: Math.max(vista.getZoom() ?? 0, ZOOM_MI_UBICACION),
        duration: 700,
      });
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'No se pudo obtener tu ubicación');
    } finally {
      this.ubicando.set(false);
    }
  }

  /** Copia la última ubicación obtenida a las coordenadas del punto */
  protected usarMiUbicacion(): void {
    const ubicacion = this.ultimaUbicacion();
    if (!ubicacion) return;
    this.fijarDesdeMapa(redondear(ubicacion.latitud), redondear(ubicacion.longitud));
  }

  protected guardar(): void {
    if (this.formulario.invalid || this.guardando()) {
      this.formulario.markAllAsTouched();
      return;
    }

    const { nombre, descripcion, latitud, longitud, categoriaId } = this.formulario.getRawValue();
    if (latitud === null || longitud === null || categoriaId === null) return;

    const datos: DatosPunto = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() === '' ? null : descripcion.trim(),
      latitud,
      longitud,
      categoriaId,
    };

    this.guardando.set(true);
    const peticion =
      this.idEdicion === null
        ? this.puntosService.crear(datos)
        : this.puntosService.actualizar(this.idEdicion, datos);

    peticion.subscribe({
      next: () => {
        this.toast.exito('Punto guardado correctamente');
        void this.router.navigate(['/puntos']);
      },
      error: (error: unknown) => {
        this.guardando.set(false);
        this.toast.error(mensajeError(error));
      },
    });
  }

  private llenarFormulario(punto: Punto): void {
    this.formulario.setValue({
      nombre: punto.nombre,
      categoriaId: punto.categoria.id,
      descripcion: punto.descripcion ?? '',
      latitud: punto.latitud,
      longitud: punto.longitud,
    });
  }

  /** Fija las coordenadas, las escribe en el formulario y coloca la marca */
  private fijarDesdeMapa(latitud: number, longitud: number): void {
    const { latitud: campoLat, longitud: campoLon } = this.formulario.controls;
    campoLat.setValue(latitud, { emitEvent: false });
    campoLon.setValue(longitud, { emitEvent: false });
    for (const campo of [campoLat, campoLon]) {
      campo.markAsDirty();
      campo.markAsTouched();
    }
    this.colocarMarca(latitud, longitud);
    // El clic llega desde OpenLayers, fuera de los eventos de Angular: se pide repintar
    this.detector.markForCheck();
  }

  /** Coloca la marca según lo que haya en los campos; si no son válidos, la quita */
  private moverMarcaDesdeFormulario(zoom?: number): void {
    const { latitud, longitud } = this.formulario.controls;
    if (latitud.value === null || longitud.value === null || latitud.invalid || longitud.invalid) {
      this.fuente.clear();
      return;
    }
    this.colocarMarca(latitud.value, longitud.value, zoom);
  }

  private colocarMarca(latitud: number, longitud: number, zoom?: number): void {
    const centro = fromLonLat([longitud, latitud]);
    this.fuente.clear();
    this.fuente.addFeature(new Feature({ geometry: new Point(centro) }));

    const vista = this.mapa?.getView();
    vista?.animate({
      center: centro,
      zoom: zoom ?? Math.max(vista.getZoom() ?? 0, ZOOM_CON_PUNTO),
      duration: 350,
    });
  }

  private estiloMarca(): Style {
    return new Style({
      image: new EstiloCirculo({
        radius: 11,
        fill: new Fill({ color: this.colorMarca() }),
        stroke: new Stroke({ color: '#ffffff', width: 4 }),
      }),
    });
  }
}
