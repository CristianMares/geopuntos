import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { ConfirmacionService } from '../../services/confirmacion.service';

/**
 * Ventana de confirmación para acciones que no se pueden deshacer.
 * Usa el elemento <dialog>, que ya resuelve el bloqueo del foco, la tecla Esc y el fondo.
 */
@Component({
  selector: 'app-modal-confirmacion',
  templateUrl: './modal-confirmacion.html',
  styleUrl: './modal-confirmacion.scss',
})
export class ModalConfirmacion {
  protected readonly confirmacion = inject(ConfirmacionService);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  constructor() {
    effect(() => {
      const abierta = this.confirmacion.solicitud() !== null;
      const dialogo = this.dialogo().nativeElement;
      if (abierta && !dialogo.open) dialogo.showModal();
      else if (!abierta && dialogo.open) dialogo.close();
    });
  }

  /** Esc: se trata como "Cancelar" para que la promesa quede resuelta */
  protected alCancelar(evento: Event): void {
    evento.preventDefault();
    this.confirmacion.responder(false);
  }

  /** Un clic en el fondo oscuro, fuera de la tarjeta, también cancela */
  protected alHacerClic(evento: MouseEvent): void {
    if (evento.target === this.dialogo().nativeElement) {
      this.confirmacion.responder(false);
    }
  }
}
