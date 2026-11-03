import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-avisos',
  templateUrl: './avisos.html',
  styleUrl: './avisos.scss',
})
export class Avisos {
  protected readonly toast = inject(ToastService);
}
