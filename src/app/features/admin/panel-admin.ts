
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  CurrencyPipe,
  DatePipe
} from '@angular/common';

import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';
import { forkJoin } from 'rxjs';

import { API_URL } from '../../core/api.config';
import { AuthService } from '../../core/services/auth.service';
import { Producto } from '../../core/models/producto.model';
import { Pedido } from '../../core/models/pedido.model';


interface PerfilAdministrativo {
  id_usuario: number;
  nombre_completo: string;
  correo_electronico: string;
  rol: string;
  id_veterinaria: number | null;
  activo: boolean;
}

interface VeterinariaAdmin {
  id_veterinaria: number;
  nombre_comercial: string;
  activo: boolean;
}

interface BorradorProducto {
  stock: number;
  precio_venta: number;
}

type SeccionPanel = 'resumen' | 'productos' | 'pedidos';


@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './panel-admin.html',
  styleUrl: './panel-admin.css'
})
export class PanelAdmin implements OnInit {

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  perfil: PerfilAdministrativo | null = null;

  productos: Producto[] = [];
  pedidos: Pedido[] = [];
  veterinarias: VeterinariaAdmin[] = [];

  borradores: Record<number, BorradorProducto> = {};

  seccion: SeccionPanel = 'resumen';

  cargando = true;
  guardandoProductoId: number | null = null;
  procesandoPedidoId: number | null = null;

  filtroVeterinaria = 'todas';
  filtroEstado = 'todos';
  busquedaProducto = '';

  error = '';
  mensaje = '';

  ngOnInit(): void {
    if (!this.authService.estaAutenticado()) {
      this.router.navigate(['/login']);
      return;
    }

    this.cargarPerfil();
  }

  private headers(): HttpHeaders {
    const token = this.authService.obtenerToken();

    return new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`
    });
  }

  cargarPerfil(): void {
    this.cargando = true;
    this.error = '';
    this.perfil = null;

    this.http.get<PerfilAdministrativo>(
      `${API_URL}/usuarios/me`,
      { headers: this.headers() }
    ).subscribe({
      next: (perfil) => {
        if (
          !perfil.activo ||
          !['admin', 'veterinaria'].includes(perfil.rol)
        ) {
          this.cargando = false;
          this.error =
            'No tienes permisos para entrar al panel administrativo.';
          this.cdr.detectChanges();
          return;
        }

        if (
          perfil.rol === 'veterinaria' &&
          perfil.id_veterinaria == null
        ) {
          this.cargando = false;
          this.error =
            'Tu cuenta no tiene una veterinaria asignada.';
          this.cdr.detectChanges();
          return;
        }

        this.perfil = perfil;

        if (perfil.rol === 'veterinaria') {
          this.filtroVeterinaria =
            String(perfil.id_veterinaria);
        }

        this.cargarDatos();
      },

      error: (err) => {
        this.cargando = false;
        this.manejarError(
          err,
          'No pudimos cargar tu perfil.'
        );
      }
    });
  }

  cargarDatos(): void {
    if (!this.perfil) return;

    this.cargando = true;
    this.error = '';
    this.mensaje = '';

    forkJoin({
      productos: this.http.get<Producto[]>(
        `${API_URL}/productos`
      ),

      pedidos: this.http.get<Pedido[]>(
        `${API_URL}/gestion-pedidos`,
        { headers: this.headers() }
      ),

      veterinarias: this.http.get<VeterinariaAdmin[]>(
        `${API_URL}/veterinarias`
      )
    }).subscribe({
      next: (respuesta) => {
        this.veterinarias = respuesta.veterinarias;
        this.productos = respuesta.productos;
        this.pedidos = respuesta.pedidos;

        this.prepararBorradores();

        this.cargando = false;
        this.cdr.detectChanges();
      },

      error: (err) => {
        this.cargando = false;
        this.manejarError(
          err,
          'No pudimos cargar los datos del panel.'
        );
      }
    });
  }

  get esAdmin(): boolean {
    return this.perfil?.rol === 'admin';
  }

  get veterinariaAsignada(): number | null {
    return this.perfil?.id_veterinaria ?? null;
  }

  cambiarSeccion(seccion: SeccionPanel): void {
    this.seccion = seccion;
    this.error = '';
    this.mensaje = '';
  }

  nombreVeterinaria(id: number): string {
    return this.veterinarias.find(
      (v) => v.id_veterinaria === id
    )?.nombre_comercial ?? `Veterinaria #${id}`;
  }

  get productosVisibles(): Producto[] {
    const busqueda = this.busquedaProducto
      .trim()
      .toLowerCase();

    return this.productos.filter((producto) => {
      if (
        this.perfil?.rol === 'veterinaria' &&
        producto.id_veterinaria !== this.veterinariaAsignada
      ) {
        return false;
      }

      if (
        this.esAdmin &&
        this.filtroVeterinaria !== 'todas' &&
        producto.id_veterinaria !==
          Number(this.filtroVeterinaria)
      ) {
        return false;
      }

      return (
        producto.nombre_producto
          .toLowerCase()
          .includes(busqueda) ||
        (producto.categoria ?? '')
          .toLowerCase()
          .includes(busqueda)
      );
    });
  }

  get pedidosVisibles(): Pedido[] {
    return this.pedidos
      .filter((pedido) => {
        if (
          this.perfil?.rol === 'veterinaria' &&
          pedido.id_veterinaria !== this.veterinariaAsignada
        ) {
          return false;
        }

        if (
          this.esAdmin &&
          this.filtroVeterinaria !== 'todas' &&
          pedido.id_veterinaria !==
            Number(this.filtroVeterinaria)
        ) {
          return false;
        }

        if (
          this.filtroEstado !== 'todos' &&
          pedido.estado_pedido !== this.filtroEstado
        ) {
          return false;
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.fecha_pedido).getTime() -
          new Date(a.fecha_pedido).getTime()
      );
  }

  get cantidadProductos(): number {
    return this.productosVisibles.length;
  }

  get cantidadPedidos(): number {
    return this.pedidosVisibles.length;
  }

  get pedidosPendientes(): number {
    return this.pedidosVisibles.filter(
      (p) => p.estado_pedido === 'pendiente'
    ).length;
  }

  get valorPedidos(): number {
    return this.pedidosVisibles
      .filter(
        (p) => p.estado_pedido !== 'cancelado'
      )
      .reduce(
        (total, pedido) =>
          total + this.precio(pedido.total),
        0
      );
  }

  precio(valor: string | number): number {
    return Number(valor) || 0;
  }

  private prepararBorradores(): void {
    this.borradores = {};

    for (const producto of this.productos) {
      this.borradores[producto.id_producto] = {
        stock: producto.stock,
        precio_venta: this.precio(producto.precio_venta)
      };
    }
  }

  puedeModificarProducto(producto: Producto): boolean {
    if (!this.perfil) return false;

    if (this.perfil.rol === 'admin') {
      return true;
    }

    return (
      this.perfil.rol === 'veterinaria' &&
      this.perfil.id_veterinaria ===
        producto.id_veterinaria
    );
  }

  guardarProducto(producto: Producto): void {
    if (
      !this.puedeModificarProducto(producto) ||
      this.guardandoProductoId !== null ||
      this.procesandoPedidoId !== null
    ) {
      return;
    }

    const borrador =
      this.borradores[producto.id_producto];

    if (!borrador) return;

    if (
      !Number.isInteger(borrador.stock) ||
      borrador.stock < 0 ||
      !Number.isFinite(borrador.precio_venta) ||
      borrador.precio_venta < 0
    ) {
      this.error =
        'El stock debe ser un entero no negativo ' +
        'y el precio no puede ser negativo.';
      this.cdr.detectChanges();
      return;
    }

    this.error = '';
    this.mensaje = '';
    this.guardandoProductoId = producto.id_producto;

    this.http.patch<Producto>(
      `${API_URL}/productos/${producto.id_producto}`,
      {
        stock: borrador.stock,
        precio_venta: borrador.precio_venta
      },
      { headers: this.headers() }
    ).subscribe({
      next: (actualizado) => {
        this.productos = this.productos.map(
          (p) =>
            p.id_producto === actualizado.id_producto
              ? actualizado
              : p
        );

        this.borradores[actualizado.id_producto] = {
          stock: actualizado.stock,
          precio_venta: this.precio(
            actualizado.precio_venta
          )
        };

        this.guardandoProductoId = null;
        this.mensaje =
          `Producto "${actualizado.nombre_producto}" actualizado.`;

        this.cdr.detectChanges();
      },

      error: (err) => {
        this.guardandoProductoId = null;
        this.manejarError(
          err,
          'No pudimos guardar el producto.'
        );
      }
    });
  }

  siguienteEstado(estado: string): string | null {
    const cambios: Record<string, string> = {
      pendiente: 'confirmado',
      confirmado: 'enviado',
      enviado: 'entregado'
    };

    return cambios[estado] ?? null;
  }

  etiquetaEstado(estado: string): string {
    const nombres: Record<string, string> = {
      pendiente: 'Pendiente',
      confirmado: 'Confirmado',
      enviado: 'Enviado',
      entregado: 'Entregado',
      cancelado: 'Cancelado'
    };

    return nombres[estado] ?? estado;
  }

  avanzarPedido(pedido: Pedido): void {
    if (
      !this.perfil ||
      this.procesandoPedidoId !== null ||
      this.guardandoProductoId !== null
    ) {
      return;
    }

    const siguiente = this.siguienteEstado(
      pedido.estado_pedido
    );

    if (!siguiente) return;

    const confirmado = window.confirm(
      `¿Cambiar el pedido #${pedido.id_pedido} ` +
      `de "${this.etiquetaEstado(pedido.estado_pedido)}" ` +
      `a "${this.etiquetaEstado(siguiente)}"?`
    );

    if (!confirmado) return;

    this.error = '';
    this.mensaje = '';
    this.procesandoPedidoId = pedido.id_pedido;

    this.http.patch<Pedido>(
      `${API_URL}/gestion-pedidos/${pedido.id_pedido}/estado`,
      {
        estado_pedido: siguiente
      },
      { headers: this.headers() }
    ).subscribe({
      next: (actualizado) => {
        this.pedidos = this.pedidos.map(
          (p) =>
            p.id_pedido === actualizado.id_pedido
              ? actualizado
              : p
        );

        this.procesandoPedidoId = null;
        this.mensaje =
          `Pedido #${actualizado.id_pedido}: ` +
          this.etiquetaEstado(actualizado.estado_pedido);

        this.cdr.detectChanges();
      },

      error: (err) => {
        this.procesandoPedidoId = null;
        this.manejarError(
          err,
          'No pudimos actualizar el pedido.'
        );
      }
    });
  }

  private manejarError(
    err: any,
    mensaje: string
  ): void {
    console.error(
      'Error en panel administrativo:',
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
    } else if (err.status === 403) {
      this.error =
        'Tu cuenta no tiene permisos para esta operación.';
    } else if (
      err.status === 0 ||
      err.status >= 500
    ) {
      this.error =
        'No pudimos confirmar el resultado. ' +
        'Actualiza el panel antes de repetir la operación.';
    } else {
      this.error = mensaje;
    }

    this.cdr.detectChanges();
  }
}
