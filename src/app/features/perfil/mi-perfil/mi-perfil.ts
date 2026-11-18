
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import {
  DatePipe
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

const API_URL = '/api';

interface PerfilUsuario {
  id_usuario: number;
  nombre_completo: string;
  correo_electronico: string;
  telefono: string | null;
  direccion: string | null;
  fecha_registro: string;
  rol: string;
  id_veterinaria: number | null;
  activo: boolean;
}

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    DatePipe
  ],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css'
})
export class MiPerfil implements OnInit {

  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  perfil: PerfilUsuario | null = null;

  nombreCompleto = '';
  telefono = '';
  direccion = '';

  cargando = true;
  guardando = false;
  editando = false;

  error = '';
  mensaje = '';

  ngOnInit(): void {
    this.cargarPerfil();
  }

  private headers(): HttpHeaders {
    const token = sessionStorage.getItem(
      'peludos_token'
    );

    return new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`
    });
  }

  cargarPerfil(): void {
    const token = sessionStorage.getItem(
      'peludos_token'
    );

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.cargando = true;
    this.error = '';
    this.mensaje = '';

    this.http.get<PerfilUsuario>(
      `${API_URL}/usuarios/me`,
      {
        headers: this.headers()
      }
    ).subscribe({
      next: (respuesta) => {
        this.perfil = respuesta;
        this.cargarFormulario(respuesta);

        this.cargando = false;
        this.cdr.detectChanges();
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

  private cargarFormulario(
    usuario: PerfilUsuario
  ): void {
    this.nombreCompleto =
      usuario.nombre_completo;

    this.telefono = usuario.telefono ?? '';
    this.direccion = usuario.direccion ?? '';
  }

  get iniciales(): string {
    const nombre = this.perfil?.nombre_completo
      .trim() ?? '';

    if (!nombre) return '🐾';

    const partes = nombre.split(/\s+/);

    if (partes.length === 1) {
      return partes[0].substring(0, 2).toUpperCase();
    }

    return (
      partes[0][0] +
      partes[partes.length - 1][0]
    ).toUpperCase();
  }

  get nombreRol(): string {
    if (this.perfil?.rol === 'admin') {
      return 'Administrador general';
    }

    if (this.perfil?.rol === 'veterinaria') {
      return 'Personal veterinario';
    }

    return 'Cliente PeludOS';
  }

  get tienePanel(): boolean {
    return (
      this.perfil?.rol === 'admin' ||
      (
        this.perfil?.rol === 'veterinaria' &&
        this.perfil.id_veterinaria !== null
      )
    );
  }

  comenzarEdicion(): void {
    if (!this.perfil || this.guardando) return;

    this.cargarFormulario(this.perfil);
    this.error = '';
    this.mensaje = '';
    this.editando = true;
  }

  descartarCambios(): void {
    if (this.guardando) return;

    if (this.perfil) {
      this.cargarFormulario(this.perfil);
    }

    this.editando = false;
    this.error = '';
  }

  guardarPerfil(): void {
    if (
      !this.perfil ||
      this.guardando ||
      !this.editando
    ) {
      return;
    }

    const nombre = this.nombreCompleto.trim();
    const telefono = this.telefono.trim();
    const direccion = this.direccion.trim();

    if (nombre.length < 3) {
      this.error =
        'El nombre debe tener al menos 3 caracteres.';
      this.cdr.detectChanges();
      return;
    }

    if (nombre.length > 100) {
      this.error =
        'El nombre es demasiado largo.';
      this.cdr.detectChanges();
      return;
    }

    if (telefono.length > 20) {
      this.error =
        'El teléfono no puede superar 20 caracteres.';
      this.cdr.detectChanges();
      return;
    }

    this.guardando = true;
    this.error = '';
    this.mensaje = '';

    this.http.patch<PerfilUsuario>(
      `${API_URL}/usuarios/me`,
      {
        nombre_completo: nombre,
        telefono: telefono || null,
        direccion: direccion || null
      },
      {
        headers: this.headers()
      }
    ).subscribe({
      next: (actualizado) => {
        this.perfil = actualizado;
        this.cargarFormulario(actualizado);

        this.guardando = false;
        this.editando = false;

        this.mensaje =
          '¡Tus datos se actualizaron correctamente! 💗';

        this.cdr.detectChanges();
      },

      error: (err) => {
        this.guardando = false;

        this.manejarError(
          err,
          'No pudimos guardar tus cambios.'
        );
      }
    });
  }

  private manejarError(
    err: any,
    mensajePredeterminado: string
  ): void {
    console.error(
      'Error en Mi perfil:',
      err.status,
      err.error
    );

    if (err.status === 401) {
      sessionStorage.removeItem('peludos_token');
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
        'Actualiza tu perfil antes de repetir la acción.';
    } else {
      this.error = mensajePredeterminado;
    }

    this.cdr.detectChanges();
  }
}
