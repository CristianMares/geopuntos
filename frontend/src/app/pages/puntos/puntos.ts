import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Categoria } from '../../models/categoria';
import { Punto } from '../../models/punto';
import { CategoriasService } from '../../services/categorias.service';
import { PuntosService } from '../../services/puntos.service';
import { mensajeError } from '../../utils/errores';
import { formatearFecha } from '../../utils/fechas';

@Component({
  selector: 'app-puntos',
  imports: [RouterLink],
  templateUrl: './puntos.html',
  styleUrl: './puntos.scss',
})
export class Puntos implements OnInit {
  private readonly puntosService = inject(PuntosService);
  private readonly categoriasService = inject(CategoriasService);

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
