
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { CarritoService } from '../../../core/services/carrito.service';
import { PedidosService } from '../../../core/services/pedidos.service';
import { ProductosService } from '../../../core/services/productos.service';
import { AuthService } from '../../../core/services/auth.service';

import { Carrito } from '../../../core/models/carrito.model';
import {
  Pedido,
  PedidoCreate
} from '../../../core/models/pedido.model';
import { Producto } from '../../../core/models/producto.model';

@Component({
  selector: 'app-finalizar-compra',
  imports: [
    CurrencyPipe,
    FormsModule,
    RouterLink
  ],
  templateUrl: './finalizar-compra.html',
  styleUrl: './finalizar-compra.css'
})
export class FinalizarCompra implements OnInit {

  private carritoService = inject(CarritoService);
  private pedidosService = inject(PedidosService);
  private productosService = inject(ProductosService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  carrito: Carrito | null = null;
  pedidoConfirmado: Pedido | null = null;

  productos: Producto[] = [];

  direccionEntrega = '';
  metodoPago = 'contra_entrega';
  notas = '';

  cargando = true;
  confirmando = false;
  error = '';

  ngOnInit(): void {
    if (!this.authService.estaAutenticado()) {
      this.router.navigate(['/login']);
      return;
    }

    this.cargarCarrito();
    this.cargarProductos();
  }

  cargarCarrito(): void {
    this.cargando = true;
    this.error = '';

    this.carritoService.obtenerCarrito().subscribe({
      next: (respuesta) => {
        this.carrito = respuesta;
        this.cargando = false;
        this.cdr.detectChanges();
      },

      error: (err) => {
        this.cargando = false;

        this.manejarError(
          err,
          'No pudimos cargar el resumen del carrito.'
        );
      }
    });
  }

  cargarProductos(): void {
    this.productosService.listarProductos().subscribe({
      next: (productos) => {
        this.productos = productos;
        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error(
          'No se pudo consultar el catálogo:',
          err.status
        );

        // El checkout continúa funcionando.
        // Los identificadores se mostrarán
        // como alternativa.
        this.cdr.detectChanges();
      }
    });
  }

  obtenerProducto(
    idProducto: number
  ): Producto | undefined {
    return this.productos.find(
      producto => producto.id_producto === idProducto
    );
  }

  nombreProducto(idProducto: number): string {
    return (
      this.obtenerProducto(idProducto)?.nombre_producto
      ?? `Producto #${idProducto}`
    );
  }

  imagenProducto(idProducto: number): string | null {
    return (
      this.obtenerProducto(idProducto)?.imagen_url
      ?? null
    );
  }

  get cantidadTotal(): number {
    return this.carrito?.detalles.reduce(
      (total, detalle) => total + detalle.cantidad,
      0
    ) ?? 0;
  }

  convertirPrecio(valor: string | number): number {
    return Number(valor) || 0;
  }

  confirmarPedido(): void {
    if (this.confirmando || this.pedidoConfirmado) {
      return;
    }

    this.error = '';

    if (!this.carrito || this.carrito.detalles.length === 0) {
      this.error = 'Tu carrito está vacío.';
      this.cdr.detectChanges();
      return;
    }

    const direccion = this.direccionEntrega.trim();

    if (direccion.length < 5) {
      this.error =
        'Escribe una dirección de entrega válida.';
      this.cdr.detectChanges();
      return;
    }

    const datos: PedidoCreate = {
      direccion_entrega: direccion,
      metodo_pago: this.metodoPago || null,
      notas: this.notas.trim() || null
    };

    this.confirmando = true;
    this.cdr.detectChanges();

    this.pedidosService.confirmarCompra(datos).subscribe({
      next: (pedido) => {
        this.pedidoConfirmado = pedido;
        this.confirmando = false;
        this.carrito = null;
        this.cdr.detectChanges();
      },

      error: (err) => {
        this.confirmando = false;

        this.manejarError(
          err,
          'No fue posible confirmar el pedido.'
        );
      }
    });
  }

  manejarError(err: any, mensaje: string): void {
    console.error(
      'Error al finalizar compra:',
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
    } else if (err.status === 409) {
      this.error =
        'No pudimos confirmar el pedido. ' +
        'Revisa los productos y el stock disponible.';
    } else if (err.status === 422) {
      this.error =
        'Revisa la dirección y los datos del pedido.';
    } else if (err.status === 0 || err.status >= 500) {
      this.error =
        'No pudimos comprobar si el pedido se registró. ' +
        'Consulta Mis pedidos antes de volver a intentarlo.';
    } else {
      this.error = mensaje;
    }

    this.cdr.detectChanges();
  }
}
