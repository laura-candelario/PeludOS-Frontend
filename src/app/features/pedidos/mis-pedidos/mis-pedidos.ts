
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import {
  CurrencyPipe,
  DatePipe
} from '@angular/common';

import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  PedidosService
} from '../../../core/services/pedidos.service';

import {
  AuthService
} from '../../../core/services/auth.service';

import { Pedido } from '../../../core/models/pedido.model';

@Component({
  selector: 'app-mis-pedidos',
  imports: [
    RouterLink,
    FormsModule,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './mis-pedidos.html',
  styleUrl: './mis-pedidos.css'
})
export class MisPedidos implements OnInit {

  private pedidosService = inject(PedidosService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  pedidos: Pedido[] = [];

  cargando = true;
  procesandoId: number | null = null;
  detalleAbiertoId: number | null = null;
  editandoId: number | null = null;

  direccionEditada = '';
  notasEditadas = '';

  error = '';
  mensaje = '';

  ngOnInit(): void {
    if (!this.authService.estaAutenticado()) {
      this.router.navigate(['/login']);
      return;
    }

    this.cargarPedidos();
  }

  cargarPedidos(): void {
    this.cargando = true;
    this.error = '';

    this.pedidosService.obtenerMisPedidos().subscribe({
      next: (respuesta) => {
        this.pedidos = [...respuesta].sort(
          (a, b) =>
            new Date(b.fecha_pedido).getTime() -
            new Date(a.fecha_pedido).getTime()
        );

        this.cargando = false;
        this.cdr.detectChanges();
      },

      error: (err) => {
        this.cargando = false;
        this.manejarError(
          err,
          'No pudimos cargar tus pedidos.'
        );
      }
    });
  }

  convertirPrecio(valor: string | number): number {
    return Number(valor) || 0;
  }

  nombreEstado(estado: string): string {
    const estados: Record<string, string> = {
      pendiente: 'Pendiente',
      confirmado: 'Confirmado',
      en_preparacion: 'En preparación',
      enviado: 'Enviado',
      entregado: 'Entregado',
      cancelado: 'Cancelado'
    };

    return estados[estado?.toLowerCase()]
      ?? estado
      ?? 'Sin estado';
  }

  claseEstado(estado: string): string {
    const valor = estado?.toLowerCase();

    if (valor === 'entregado') {
      return 'estado-exitoso';
    }

    if (valor === 'cancelado') {
      return 'estado-cancelado';
    }

    if (
      valor === 'confirmado' ||
      valor === 'enviado'
    ) {
      return 'estado-proceso';
    }

    return 'estado-pendiente';
  }

  puedeEditar(pedido: Pedido): boolean {
    return pedido.estado_pedido === 'pendiente';
  }

  puedeCancelar(pedido: Pedido): boolean {
    return ![
      'enviado',
      'entregado',
      'cancelado'
    ].includes(pedido.estado_pedido);
  }

  verDetalles(pedido: Pedido): void {
    this.error = '';

    if (this.detalleAbiertoId === pedido.id_pedido) {
      this.detalleAbiertoId = null;
      this.editandoId = null;
    } else {
      this.detalleAbiertoId = pedido.id_pedido;
      this.editandoId = null;
    }
  }

  iniciarEdicion(pedido: Pedido): void {
    if (
      !this.puedeEditar(pedido) ||
      this.procesandoId !== null
    ) {
      return;
    }

    this.error = '';
    this.mensaje = '';

    this.detalleAbiertoId = pedido.id_pedido;
    this.editandoId = pedido.id_pedido;
    this.direccionEditada = pedido.direccion_entrega ?? '';
    this.notasEditadas = pedido.notas ?? '';
  }

  cancelarEdicion(): void {
    this.editandoId = null;
  }

  guardarEntrega(pedido: Pedido): void {
    if (
      this.procesandoId !== null ||
      !this.puedeEditar(pedido)
    ) {
      return;
    }

    const direccion = this.direccionEditada.trim();

    if (direccion.length < 5) {
      this.error =
        'La dirección debe tener al menos 5 caracteres.';
      this.cdr.detectChanges();
      return;
    }

    this.error = '';
    this.mensaje = '';
    this.procesandoId = pedido.id_pedido;

    this.pedidosService.actualizarEntrega(
      pedido.id_pedido,
      {
        direccion_entrega: direccion,
        notas: this.notasEditadas.trim() || null
      }
    ).subscribe({
      next: (actualizado) => {
        this.actualizarPedidoEnLista(actualizado);
        this.procesandoId = null;
        this.editandoId = null;
        this.mensaje =
          `Los datos del pedido #${pedido.id_pedido} se actualizaron.`;
        this.cdr.detectChanges();
      },

      error: (err) => {
        this.procesandoId = null;
        this.manejarError(
          err,
          'No pudimos actualizar los datos de entrega.'
        );
      }
    });
  }

  cancelarPedido(pedido: Pedido): void {
    if (
      !this.puedeCancelar(pedido) ||
      this.procesandoId !== null
    ) {
      return;
    }

    const confirmado = window.confirm(
      `¿Quieres cancelar el pedido #${pedido.id_pedido}?\n\n` +
      'Esta acción devolverá los productos al inventario ' +
      'y no podrás continuar con ese pedido.'
    );

    if (!confirmado) return;

    this.error = '';
    this.mensaje = '';
    this.procesandoId = pedido.id_pedido;

    this.pedidosService.cancelarPedido(
      pedido.id_pedido
    ).subscribe({
      next: (actualizado) => {
        this.actualizarPedidoEnLista(actualizado);

        this.procesandoId = null;
        this.editandoId = null;

        this.mensaje =
          `El pedido #${pedido.id_pedido} fue cancelado.`;

        this.cdr.detectChanges();
      },

      error: (err) => {
        this.procesandoId = null;

        this.manejarError(
          err,
          'No pudimos cancelar el pedido.'
        );
      }
    });
  }

  private actualizarPedidoEnLista(actualizado: Pedido): void {
    this.pedidos = this.pedidos.map(pedido =>
      pedido.id_pedido === actualizado.id_pedido
        ? actualizado
        : pedido
    );
  }

  private manejarError(err: any, mensaje: string): void {
    console.error(
      'Error en pedidos:',
      err.status,
      err.error
    );

    if (err.status === 401) {
      this.authService.cerrarSesion();
      this.router.navigate(['/login']);
      return;
    }

    if (typeof err.error?.detail === 'string') {
      this.error = err.error.detail;
    } else if (
      err.status === 0 ||
      err.status >= 500
    ) {
      this.error =
        'No pudimos comprobar el resultado. ' +
        'Actualiza el historial antes de repetir la acción.';
    } else {
      this.error = mensaje;
    }

    this.cdr.detectChanges();
  }
}
