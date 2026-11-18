
import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import { Observable } from 'rxjs';

import { API_URL } from '../api.config';
import { Producto } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  private http = inject(HttpClient);

  // Consultar el catálogo de productos activos
  listarProductos(
    categoria?: string,
    idVeterinaria?: number
  ): Observable<Producto[]> {

    let params = new HttpParams();

    if (categoria) {
      params = params.set('categoria', categoria);
    }

    if (idVeterinaria !== undefined) {
      params = params.set(
        'id_veterinaria',
        idVeterinaria.toString()
      );
    }

    return this.http.get<Producto[]>(
      `${API_URL}/productos`,
      { params }
    );
  }

  // Consultar los detalles de un producto
  obtenerProducto(id: number): Observable<Producto> {

    return this.http.get<Producto>(
      `${API_URL}/productos/${id}`
    );

  }
}
