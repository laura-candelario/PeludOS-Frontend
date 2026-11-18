
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ProductosService } from '../../../core/services/productos.service';
import { CarritoService } from '../../../core/services/carrito.service';
import { AuthService } from '../../../core/services/auth.service';

import { Producto } from '../../../core/models/producto.model';
import { Carrito } from '../../../core/models/carrito.model';

@Component({
  selector: 'app-catalogo',
  imports: [FormsModule, RouterLink, CurrencyPipe],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class Catalogo implements OnInit {

  private productosService = inject(ProductosService);
  private carritoService = inject(CarritoService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  productos: Producto[] = [];
  productoSeleccionado: Producto | null = null;
  carrito: Carrito | null = null;

  busqueda = '';
  categoriaSeleccionada = '';

  cargando = true;
  cargandoDetalle = false;

  agregandoId: number | null = null;
  ultimoAgregadoId: number | null = null;

  error = '';
  errorDetalle = '';
  errorCarrito = '';
  mensaje = '';

  ngOnInit(): void {
    this.cargarProductos();

    if (this.authService.estaAutenticado()) {
      this.cargarResumenCarrito();
    }
  }

  cargarProductos(): void {
    this.cargando = true;
    this.error = '';

    this.productosService.listarProductos().subscribe({
      next: (productos) => {
        this.productos = productos;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar productos:', err.status);

        this.error = 'No pudimos cargar los productos.';
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  cargarResumenCarrito(): void {
    if (!this.authService.estaAutenticado()) {
      this.carrito = null;
      return;
    }

    this.carritoService.obtenerCarrito().subscribe({
      next: (carrito) => {
        this.carrito = carrito;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al consultar carrito:', err.status);
        this.cdr.markForCheck();
      }
    });
  }

  get cantidadTotalCarrito(): number {
    return this.carrito?.detalles.reduce(
      (total, detalle) => total + detalle.cantidad,
      0
    ) ?? 0;
  }

  cantidadProductoEnCarrito(idProducto: number): number {
    return this.carrito?.detalles
      .filter(detalle => detalle.id_producto === idProducto)
      .reduce(
        (total, detalle) => total + detalle.cantidad,
        0
      ) ?? 0;
  }

  get categorias(): string[] {
    const categoriasDisponibles = this.productos
      .map(producto => producto.categoria)
      .filter(
        (categoria): categoria is string =>
          typeof categoria === 'string' &&
          categoria.trim().length > 0
      );

    return [...new Set(categoriasDisponibles)].sort();
  }

  get productosFiltrados(): Producto[] {
    const texto = this.busqueda.trim().toLocaleLowerCase();

    return this.productos.filter(producto => {
      const coincideBusqueda =
        !texto ||
        producto.nombre_producto
          .toLocaleLowerCase()
          .includes(texto) ||
        (producto.descripcion ?? '')
          .toLocaleLowerCase()
          .includes(texto);

      const coincideCategoria =
        !this.categoriaSeleccionada ||
        producto.categoria === this.categoriaSeleccionada;

      return coincideBusqueda && coincideCategoria;
    });
  }

  tieneStock(producto: Producto): boolean {
    return producto.stock > 0;
  }

  verDetalles(producto: Producto): void {
    this.cargandoDetalle = true;
    this.errorDetalle = '';
    this.productoSeleccionado = null;

    this.productosService
      .obtenerProducto(producto.id_producto)
      .subscribe({
        next: (detalle) => {
          this.productoSeleccionado = detalle;
          this.cargandoDetalle = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error al ver detalles:', err.status);

          this.errorDetalle =
            'No pudimos consultar los detalles del producto.';

          this.cargandoDetalle = false;
          this.cdr.markForCheck();
        }
      });
  }

  cerrarDetalles(): void {
    this.productoSeleccionado = null;
    this.errorDetalle = '';
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.categoriaSeleccionada = '';
  }

  agregarAlCarrito(producto: Producto): void {
    if (this.agregandoId !== null) return;

    this.errorCarrito = '';
    this.mensaje = '';

    if (!this.tieneStock(producto)) {
      this.errorCarrito = 'Este producto está agotado.';
      this.cdr.markForCheck();
      return;
    }

    if (!this.authService.estaAutenticado()) {
      this.router.navigate(['/login']);
      return;
    }

    this.agregandoId = producto.id_producto;

    this.carritoService
      .agregarProducto(producto.id_producto, 1)
      .pipe(
        finalize(() => {
          this.agregandoId = null;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.ultimoAgregadoId = producto.id_producto;

          this.mensaje =
            `¡${producto.nombre_producto} se agregó a tu carrito!`;

          // Actualizamos las cantidades desde FastAPI.
          this.cargarResumenCarrito();

          this.cdr.markForCheck();
        },

        error: (err) => {
          console.error(
            'Error al agregar producto:',
            err.status,
            err.error
          );

          if (err.status === 401) {
            this.authService.cerrarSesion();
            this.router.navigate(['/login']);
            return;
          }

          if (typeof err.error?.detail === 'string') {
            this.errorCarrito = err.error.detail;
          } else if (
            err.status === 400 ||
            err.status === 409 ||
            err.status === 422
          ) {
            this.errorCarrito =
              'No se pudo agregar el producto. ' +
              'Revisa el stock disponible.';
          } else {
            this.errorCarrito =
              'No pudimos agregar el producto al carrito.';
          }

          this.cdr.markForCheck();
        }
      });
  }
}
