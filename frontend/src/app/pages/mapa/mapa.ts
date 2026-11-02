import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

/** Pantalla provisional: confirma que la sesión funciona. El mapa real llega en el siguiente bloque. */
@Component({
  selector: 'app-mapa',
  template: `
    <main class="provisional">
      <h1>Sesión iniciada</h1>
      <p>
        {{ auth.usuario()?.nombre }} ({{ auth.usuario()?.rol }}). El mapa se construye en el
        siguiente bloque.
      </p>
      <button type="button" class="btn btn-secundario" (click)="auth.cerrarSesion()">
        Cerrar sesión
      </button>
    </main>
  `,
  styles: `
    .provisional {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      max-width: 520px;
      margin: 80px auto;
      padding: 0 24px;
    }
    p {
      margin: 0;
      color: var(--texto-suave);
    }
  `,
})
export class Mapa {
  protected readonly auth = inject(AuthService);
}
