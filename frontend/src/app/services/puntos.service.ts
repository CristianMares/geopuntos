import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Punto } from '../models/punto';

@Injectable({ providedIn: 'root' })
export class PuntosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/puntos`;

  listar(): Observable<Punto[]> {
    return this.http.get<Punto[]>(this.url);
  }
}
