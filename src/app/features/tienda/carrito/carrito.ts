
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { CarritoService } from '../../../core/services/carrito.service';
import { ProductosService } from '../../../core/services/productos.service';
import { AuthService } from '../../../core/services/auth.service';

import {
  Carrito as CarritoModelo,
  DetalleCarrito
} from '../../../core/models/carrito.model';

import { Producto } from '../../../core/models/producto.model';

@Component({
  selector: 'app-carrito',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css'
})
export class Carrito implements OnInit {

  private carritoService = inject(CarritoService);
  private productosService = inject(ProductosService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  carrito: CarritoModelo | null = null;
  productos: Producto[] = [];

  cargando = true;
  procesando = false;
  error = '';
  mensaje = '';

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
        this.cdr.markForCheck();
      },

      error: (err) => {
        this.cargando = false;
        this.manejarError(err, 'No pudimos cargar tu carrito.');
      }
    });
  }

  cargarProductos(): void {
    this.productosService.listarProductos().subscribe({
      next: (respuesta) => {
        this.productos = respuesta;
        this.cdr.markForCheck();
      },

      error: (err) => {
        console.error('Error al consultar productos:', err.status);
        this.cdr.markForCheck();
      }
    });
  }

  obtenerProducto(idProducto: number): Producto | undefined {
    return this.productos.find(
      producto => producto.id_producto === idProducto
    );
  }

  nombreProducto(idProducto: number): string {
    return this.obtenerProducto(idProducto)?.nombre_producto
      ?? `Producto #${idProducto}`;
  }

  imagenProducto(idProducto: number): string | null {
    return this.obtenerProducto(idProducto)?.imagen_url ?? null;
  }

  convertirPrecio(precio: string | number): number {
    return Number(precio);
  }

  cambiarCantidad(
    detalle: DetalleCarrito,
    cambio: number
  ): void {
    if (this.procesando) return;

    const nuevaCantidad = detalle.cantidad + cambio;

    if (nuevaCantidad < 1) return;

    this.procesando = true;
    this.error = '';
    this.mensaje = '';

    this.carritoService.actualizarCantidad(
      detalle.id_detalle_carrito,
      nuevaCantidad
    ).subscribe({
      next: () => {
        this.procesando = false;
        this.mensaje = 'Cantidad actualizada correctamente 💗';
        this.cargarCarrito();
        this.cdr.markForCheck();
      },

      error: (err) => {
        this.procesando = false;
        this.manejarError(
          err,
          'No pudimos actualizar la cantidad.'
        );
      }
    });
  }

  eliminarProducto(detalle: DetalleCarrito): void {
    if (this.procesando) return;

    const confirmado = window.confirm(
      `¿Quieres quitar "${this.nombreProducto(detalle.id_producto)}" del carrito?`
    );

    if (!confirmado) return;

    this.procesando = true;
    this.error = '';
    this.mensaje = '';

    this.carritoService.eliminarProducto(
      detalle.id_detalle_carrito
    ).subscribe({
      next: () => {
        this.procesando = false;
        this.mensaje = 'Producto eliminado del carrito.';
        this.cargarCarrito();
        this.cdr.markForCheck();
      },

      error: (err) => {
        this.procesando = false;
        this.manejarError(
          err,
          'No pudimos quitar el producto.'
        );
      }
    });
  }

  vaciarCarrito(): void {
    if (
      this.procesando ||
      !this.carrito ||
      this.carrito.detalles.length === 0
    ) {
      return;
    }

    const confirmado = window.confirm(
      '¿Quieres quitar todos los productos de tu carrito?'
    );

    if (!confirmado) return;

    this.procesando = true;
    this.error = '';
    this.mensaje = '';

    this.carritoService.vaciarCarrito().subscribe({
      next: () => {
        this.procesando = false;
        this.mensaje = 'Tu carrito quedó vacío.';
        this.cargarCarrito();
        this.cdr.markForCheck();
      },

      error: (err) => {
        this.procesando = false;
        this.manejarError(
          err,
          'No pudimos vaciar el carrito.'
        );
      }
    });
  }

  manejarError(err: any, mensaje: string): void {
    if (err.status === 401) {
      this.authService.cerrarSesion();
      this.router.navigate(['/login']);
      return;
    }

    if (typeof err.error?.detail === 'string') {
      this.error = err.error.detail;
    } else if (err.status === 422) {
      this.error = 'La cantidad o los datos no son válidos.';
    } else {
      this.error = mensaje;
    }

    this.cdr.markForCheck();
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
