import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Categoria } from '../../models/categoria';
import { Punto } from '../../models/punto';
import { ImportarPuntos } from '../../components/importar-puntos/importar-puntos';
import { CategoriasService } from '../../services/categorias.service';
import { PuntosService } from '../../services/puntos.service';
import { ToastService } from '../../services/toast.service';
import { descargarCsv, generarCsv, protegerFormula } from '../../utils/csv';
import { mensajeError } from '../../utils/errores';
import { formatearFecha } from '../../utils/fechas';

@Component({
  selector: 'app-puntos',
  imports: [RouterLink, ImportarPuntos],
  templateUrl: './puntos.html',
  styleUrl: './puntos.scss',
})
export class Puntos implements OnInit {
  private readonly puntosService = inject(PuntosService);
  private readonly categoriasService = inject(CategoriasService);
  private readonly toast = inject(ToastService);

  protected readonly puntos = signal<Punto[]>([]);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly busqueda = signal('');
  protected readonly categoriaId = signal<number | null>(null);

  protected readonly filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const categoria = this.categoriaId();
    return this.puntos().filter(
      (p) =>
        (categoria === null || p.categoria.id === categoria) &&
        (texto === '' || p.nombre.toLowerCase().includes(texto)),
    );
  });

  protected readonly fecha = formatearFecha;

  ngOnInit(): void {
    this.cargar();
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
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeError(error));
      },
    });
  }

  /** Descarga los puntos que se ven en la tabla (respeta la búsqueda y el filtro) */
  protected exportar(): void {
    const puntos = this.filtrados();
    if (puntos.length === 0) {
      this.toast.error('No hay puntos para exportar');
      return;
    }

    const filas = [
      ['nombre', 'categoria', 'descripcion', 'latitud', 'longitud', 'registrado_por', 'creado_en'],
      ...puntos.map((p) => [
        protegerFormula(p.nombre),
        p.categoria.nombre,
        protegerFormula(p.descripcion ?? ''),
        String(p.latitud),
        String(p.longitud),
        protegerFormula(p.registradoPor.nombre),
        p.creadoEn,
      ]),
    ];
    const hoy = new Date().toLocaleDateString('sv-SE');
    descargarCsv(`puntos-${hoy}.csv`, generarCsv(filas));
    this.toast.exito(puntos.length === 1 ? '1 punto exportado' : `${puntos.length} puntos exportados`);
  }

  protected alCambiarCategoria(valor: string): void {
    this.categoriaId.set(valor === '' ? null : Number(valor));
  }

  protected async eliminar(punto: Punto): Promise<void> {
    const eliminado = await this.puntosService.eliminarConConfirmacion(punto);
    if (eliminado) {
      this.puntos.update((lista) => lista.filter((p) => p.id !== punto.id));
    }
  }
}
