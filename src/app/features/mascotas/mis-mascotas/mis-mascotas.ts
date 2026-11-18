
import {
  Component,
  ChangeDetectorRef,
  OnInit,
  inject
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { MascotasService } from '../../../core/services/mascotas.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  Mascota,
  MascotaRequest
} from '../../../core/models/mascota.model';

@Component({
  selector: 'app-mis-mascotas',
  imports: [FormsModule, RouterLink],
  templateUrl: './mis-mascotas.html',
  styleUrl: './mis-mascotas.css'
})
export class MisMascotas implements OnInit {

  private mascotasService = inject(MascotasService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  mascotas: Mascota[] = [];
  detalleMascota: Mascota | null = null;

  cargando = true;
  guardando = false;
  eliminandoId: number | null = null;
  cargandoDetalle = false;

  mostrarFormulario = false;
  idEnEdicion: number | null = null;

  mensaje = '';
  error = '';

  nuevaMascota: MascotaRequest = this.formularioVacio();

  ngOnInit(): void {
    if (!this.authService.estaAutenticado()) {
      this.router.navigate(['/login']);
      return;
    }

    this.cargarMascotas();
  }

  formularioVacio(): MascotaRequest {
    return {
      nombre: '',
      especie: '',
      raza: '',
      sexo: '',
      fecha_nacimiento: '',
      peso_kg: 0,
      color_mascota: '',
      numero_chip: '',
      foto_url: '',
      alergias: '',
      condiciones_medicas: ''
    };
  }

  cargarMascotas(): void {
    this.cargando = true;

    this.mascotasService.listarMascotas().subscribe({
      next: (mascotas) => {
        this.mascotas = mascotas;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargando = false;
        this.manejarError(err, 'No pudimos cargar tus mascotas.');
      }
    });
  }

  abrirFormulario(): void {
    this.nuevaMascota = this.formularioVacio();
    this.idEnEdicion = null;
    this.detalleMascota = null;
    this.mostrarFormulario = true;
    this.mensaje = '';
    this.error = '';
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.idEnEdicion = null;
    this.error = '';
  }

  editarMascota(mascota: Mascota): void {
    if (mascota.id_mascota == null) {
      this.error = 'No se encontró el identificador de la mascota.';
      return;
    }

    this.idEnEdicion = mascota.id_mascota;

    this.nuevaMascota = {
      nombre: mascota.nombre ?? '',
      especie: mascota.especie ?? '',
      raza: mascota.raza ?? '',
      sexo: mascota.sexo ?? '',
      fecha_nacimiento: mascota.fecha_nacimiento ?? '',
      peso_kg: mascota.peso_kg ?? 0,
      color_mascota: mascota.color_mascota ?? '',
      numero_chip: mascota.numero_chip ?? '',
      foto_url: mascota.foto_url ?? '',
      alergias: mascota.alergias ?? '',
      condiciones_medicas: mascota.condiciones_medicas ?? ''
    };

    this.detalleMascota = null;
    this.mostrarFormulario = true;
    this.mensaje = '';
    this.error = '';
  }

  guardarMascota(): void {
    if (this.guardando) return;

    if (!this.nuevaMascota.nombre.trim()) {
      this.error = 'Escribe el nombre de tu mascota.';
      return;
    }

    if (!this.nuevaMascota.especie) {
      this.error = 'Selecciona la especie.';
      return;
    }

    if (
      this.nuevaMascota.peso_kg != null &&
      this.nuevaMascota.peso_kg < 0
    ) {
      this.error = 'El peso no puede ser negativo.';
      return;
    }

    this.guardando = true;
    this.error = '';
    this.mensaje = '';

    const editando = this.idEnEdicion !== null;

    const peticion = editando
      ? this.mascotasService.actualizarMascota(
          this.idEnEdicion!,
          this.nuevaMascota
        )
      : this.mascotasService.crearMascota(
          this.nuevaMascota
        );

    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarFormulario = false;
        this.idEnEdicion = null;
        this.nuevaMascota = this.formularioVacio();

        this.mensaje = editando
          ? '¡Mascota actualizada correctamente! 💗'
          : '¡Mascota registrada correctamente! 🐾💗';

        this.cargarMascotas();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.guardando = false;
        this.manejarError(
          err,
          'No pudimos guardar la información de tu mascota.'
        );
      }
    });
  }

  verDetalles(mascota: Mascota): void {
    if (mascota.id_mascota == null) {
      this.error = 'No se encontró el identificador de la mascota.';
      return;
    }

    this.cargandoDetalle = true;
    this.detalleMascota = null;
    this.error = '';

    this.mascotasService
      .obtenerMascota(mascota.id_mascota)
      .subscribe({
        next: (detalle) => {
          this.detalleMascota = detalle;
          this.cargandoDetalle = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.cargandoDetalle = false;
          this.manejarError(
            err,
            'No pudimos consultar los detalles.'
          );
        }
      });
  }

  cerrarDetalles(): void {
    this.detalleMascota = null;
  }

  eliminarMascota(mascota: Mascota): void {
    if (mascota.id_mascota == null) {
      this.error = 'No se encontró el identificador de la mascota.';
      return;
    }

    const confirmado = window.confirm(
      `¿Quieres eliminar a ${mascota.nombre} de Mis mascotas?`
    );

    if (!confirmado) return;

    const id = mascota.id_mascota;
    this.eliminandoId = id;
    this.error = '';
    this.mensaje = '';

    this.mascotasService.eliminarMascota(id).subscribe({
      next: () => {
        this.eliminandoId = null;

        if (this.detalleMascota?.id_mascota === id) {
          this.detalleMascota = null;
        }

        if (this.idEnEdicion === id) {
          this.cancelarFormulario();
        }

        this.mensaje =
          `${mascota.nombre} fue retirada de Mis mascotas.`;

        this.cargarMascotas();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.eliminandoId = null;
        this.manejarError(
          err,
          'No pudimos eliminar la mascota.'
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
      this.error =
        'Revisa los datos del formulario. FastAPI rechazó algún campo.';
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
