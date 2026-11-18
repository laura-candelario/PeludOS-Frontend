
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_URL } from '../api.config';
import { Veterinaria } from '../models/veterinaria.model';

@Injectable({
  providedIn: 'root'
})
export class VeterinariasService {

  private http = inject(HttpClient);

  // Consultar todas las veterinarias activas
  listarVeterinarias(): Observable<Veterinaria[]> {
    return this.http.get<Veterinaria[]>(
      `${API_URL}/veterinarias`
    );
  }

  // Consultar los detalles de una veterinaria
  obtenerVeterinaria(id: number): Observable<Veterinaria> {
    return this.http.get<Veterinaria>(
      `${API_URL}/veterinarias/${id}`
    );
  }
}
