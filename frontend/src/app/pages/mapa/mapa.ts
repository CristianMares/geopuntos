import { Component } from '@angular/core';

/** Pantalla provisional: el mapa con OpenLayers llega en el siguiente bloque. */
@Component({
  selector: 'app-mapa',
  template: `
    <section class="provisional">
      <h1>Mapa</h1>
      <p>El mapa con los puntos se construye en el siguiente bloque.</p>
    </section>
  `,
  styles: `
    .provisional {
      padding: 32px;
    }
    p {
      margin: 8px 0 0;
      color: var(--texto-suave);
    }
  `,
})
export class Mapa {}
