import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Pantalla provisional para las secciones que aún no se construyen */
@Component({
  selector: 'app-proximamente',
  template: `
    <section class="pendiente">
      <h1>{{ titulo }}</h1>
      <p>Esta sección se construye en uno de los siguientes pasos.</p>
    </section>
  `,
  styles: `
    .pendiente {
      padding: 32px;
    }
    p {
      margin: 8px 0 0;
      color: var(--texto-suave);
    }
  `,
})
export class Proximamente {
  protected readonly titulo = inject(ActivatedRoute).snapshot.data['titulo'] as string;
}
