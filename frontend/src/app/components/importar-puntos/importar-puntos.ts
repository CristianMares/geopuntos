import { Component, ElementRef, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { Categoria } from '../../models/categoria';
import { PuntosService } from '../../services/puntos.service';
import { ToastService } from '../../services/toast.service';
import { mensajeError } from '../../utils/errores';
import {
  MAX_FILAS,
  ResultadoAnalisis,
  analizarCsvPuntos,
  leerArchivoTexto,
} from '../../utils/importar-puntos';

const TAMANO_MAXIMO_BYTES = 1024 * 1024;
const FILAS_DE_MUESTRA = 5;
const ERRORES_MOSTRADOS = 8;

/** Ventana para importar puntos desde un CSV, con vista previa y errores por fila antes de guardar */
@Component({
  selector: 'app-importar-puntos',
  templateUrl: './importar-puntos.html',
  styleUrl: './importar-puntos.scss',
})
export class ImportarPuntos {
  readonly categorias = input.required<Categoria[]>();
  /** Se emite cuando se importó algo, para que la pantalla recargue su lista */
  readonly importado = output<void>();

  private readonly puntosService = inject(PuntosService);
  private readonly toast = inject(ToastService);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');
  private readonly campoArchivo = viewChild.required<ElementRef<HTMLInputElement>>('campoArchivo');

  protected readonly maxFilas = MAX_FILAS;
  protected readonly nombreArchivo = signal<string | null>(null);
  protected readonly analisis = signal<ResultadoAnalisis | null>(null);
  protected readonly importando = signal(false);

  protected readonly muestra = computed(() => this.analisis()?.validas.slice(0, FILAS_DE_MUESTRA) ?? []);
  protected readonly erroresVisibles = computed(
    () => this.analisis()?.conError.slice(0, ERRORES_MOSTRADOS) ?? [],
  );
  protected readonly erroresOcultos = computed(
    () => Math.max(0, (this.analisis()?.conError.length ?? 0) - ERRORES_MOSTRADOS),
  );

  abrir(): void {
    this.reiniciar();
    this.dialogo().nativeElement.showModal();
  }

  protected cerrar(): void {
    this.dialogo().nativeElement.close();
  }

  /** Al cerrar, por el botón o con Esc, se limpia para que la próxima vez empiece de cero */
  protected alCerrar(): void {
    this.reiniciar();
  }

  protected nombreCategoria(id: number): string {
    return this.categorias().find((c) => c.id === id)?.nombre ?? '';
  }

  protected async alElegirArchivo(evento: Event): Promise<void> {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (!archivo) return;

    this.nombreArchivo.set(archivo.name);
    if (archivo.size > TAMANO_MAXIMO_BYTES) {
      this.analisis.set({
        total: 0,
        validas: [],
        conError: [],
        errorGeneral: 'El archivo pesa más de 1 MB',
      });
      return;
    }

    const texto = await leerArchivoTexto(archivo);
    this.analisis.set(analizarCsvPuntos(texto, this.categorias()));
  }

  protected importar(): void {
    const analisis = this.analisis();
    if (!analisis || analisis.validas.length === 0 || this.importando()) return;

    this.importando.set(true);
    this.puntosService.importar(analisis.validas).subscribe({
      next: ({ importados }) => {
        this.importando.set(false);
        this.toast.exito(
          importados === 1 ? '1 punto importado' : `${importados} puntos importados`,
        );
        this.importado.emit();
        this.cerrar();
      },
      error: (error: unknown) => {
        this.importando.set(false);
        this.toast.error(mensajeError(error));
      },
    });
  }

  private reiniciar(): void {
    this.nombreArchivo.set(null);
    this.analisis.set(null);
    this.importando.set(false);
    // Permite elegir de nuevo el mismo archivo después de corregirlo
    this.campoArchivo().nativeElement.value = '';
  }
}
