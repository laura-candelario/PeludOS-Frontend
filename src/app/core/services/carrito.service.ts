
import { Injectable, inject } from '@angular/core';

import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import { Observable } from 'rxjs';

import { API_URL } from '../api.config';
import { AuthService } from './auth.service';

import {
  Carrito,
  AgregarCarritoRequest,
  ActualizarCantidadRequest
} from '../models/carrito.model';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private obtenerHeaders(): HttpHeaders {
    const token = this.authService.obtenerToken();

    return new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`
    });
  }

  // Obtener el carrito activo
  obtenerCarrito(): Observable<Carrito> {
    return this.http.get<Carrito>(
      `${API_URL}/carrito`,
      {
        headers: this.obtenerHeaders()
      }
    );
  }

  // Agregar un producto
  agregarProducto(
    idProducto: number,
    cantidad: number
  ): Observable<Carrito> {

    const datos: AgregarCarritoRequest = {
      id_producto: idProducto,
      cantidad: cantidad
    };

    return this.http.post<Carrito>(
      `${API_URL}/carrito/items`,
      datos,
      {
        headers: this.obtenerHeaders()
      }
    );
  }

  // Modificar cantidad
  actualizarCantidad(
    idDetalleCarrito: number,
    cantidad: number
  ): Observable<Carrito> {

    const datos: ActualizarCantidadRequest = {
      cantidad: cantidad
    };

    return this.http.patch<Carrito>(
      `${API_URL}/carrito/items/${idDetalleCarrito}`,
      datos,
      {
        headers: this.obtenerHeaders()
      }
    );
  }

  // Quitar un producto
  eliminarProducto(
    idDetalleCarrito: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${API_URL}/carrito/items/${idDetalleCarrito}`,
      {
        headers: this.obtenerHeaders()
      }
    );
  }

  // Vaciar el carrito
  vaciarCarrito(): Observable<Carrito> {
    return this.http.delete<Carrito>(
      `${API_URL}/carrito`,
      {
        headers: this.obtenerHeaders()
      }
    );
  }
}
