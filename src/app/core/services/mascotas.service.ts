
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_URL } from '../api.config';
import { AuthService } from './auth.service';
import {
  Mascota,
  MascotaRequest
} from '../models/mascota.model';

@Injectable({
  providedIn: 'root'
})
export class MascotasService {

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private obtenerHeaders(): HttpHeaders {
    const token = this.authService.obtenerToken();

    return new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`
    });
  }

  listarMascotas(): Observable<Mascota[]> {
    return this.http.get<Mascota[]>(
      `${API_URL}/mascotas`,
      { headers: this.obtenerHeaders() }
    );
  }

  crearMascota(datos: MascotaRequest): Observable<Mascota> {
    return this.http.post<Mascota>(
      `${API_URL}/mascotas`,
      datos,
      { headers: this.obtenerHeaders() }
    );
  }

  obtenerMascota(id: number): Observable<Mascota> {
    return this.http.get<Mascota>(
      `${API_URL}/mascotas/${id}`,
      { headers: this.obtenerHeaders() }
    );
  }

  actualizarMascota(
    id: number,
    datos: Partial<MascotaRequest>
  ): Observable<Mascota> {
    return this.http.patch<Mascota>(
      `${API_URL}/mascotas/${id}`,
      datos,
      { headers: this.obtenerHeaders() }
    );
  }

  eliminarMascota(id: number): Observable<unknown> {
    return this.http.delete(
      `${API_URL}/mascotas/${id}`,
      { headers: this.obtenerHeaders() }
    );
  }
}
