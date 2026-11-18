
import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_URL } from '../api.config';
import { AuthService } from './auth.service';
import {
  Pedido,
  PedidoCreate
} from '../models/pedido.model';

export interface EditarEntregaPedido {
  direccion_entrega?: string;
  notas?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PedidosService {

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private obtenerHeaders(): HttpHeaders {
    const token = this.authService.obtenerToken();

    return new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`
    });
  }

  obtenerMisPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(
      `${API_URL}/pedidos`,
      {
        headers: this.obtenerHeaders()
      }
    );
  }

  obtenerPedido(idPedido: number): Observable<Pedido> {
    return this.http.get<Pedido>(
      `${API_URL}/pedidos/${idPedido}`,
      {
        headers: this.obtenerHeaders()
      }
    );
  }

  confirmarCompra(datos: PedidoCreate): Observable<Pedido> {
    return this.http.post<Pedido>(
      `${API_URL}/pedidos`,
      datos,
      {
        headers: this.obtenerHeaders()
      }
    );
  }

  actualizarEntrega(
    idPedido: number,
    datos: EditarEntregaPedido
  ): Observable<Pedido> {
    return this.http.patch<Pedido>(
      `${API_URL}/pedidos/${idPedido}`,
      datos,
      {
        headers: this.obtenerHeaders()
      }
    );
  }

  cancelarPedido(idPedido: number): Observable<Pedido> {
    return this.http.delete<Pedido>(
      `${API_URL}/pedidos/${idPedido}`,
      {
        headers: this.obtenerHeaders()
      }
    );
  }
}
