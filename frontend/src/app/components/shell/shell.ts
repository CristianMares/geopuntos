import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/** Marco de la aplicación: menú lateral fijo y, a su derecha, la pantalla activa */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly auth = inject(AuthService);

  protected readonly iniciales = computed(() => {
    const nombre = this.auth.usuario()?.nombre ?? '';
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase() ?? '')
      .join('');
  });

  protected readonly etiquetaRol = computed(() =>
    this.auth.esAdmin() ? 'Administrador' : 'Usuario',
  );
}
