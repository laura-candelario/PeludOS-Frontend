
import {
  Component,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-registro',
  imports: [FormsModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {

  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  nombre_completo = '';
  correo_electronico = '';
  contrasena = '';
  telefono = '';
  direccion = '';

  mensaje = '';
  error = '';
  cargando = false;

  registrar(): void {

    if (this.cargando) return;

    this.mensaje = '';
    this.error = '';

    if (
      !this.nombre_completo.trim() ||
      !this.correo_electronico.trim() ||
      !this.contrasena
    ) {
      this.error = 'Completa los campos obligatorios.';
      return;
    }

    this.cargando = true;

    this.authService.registrar({
      nombre_completo: this.nombre_completo.trim(),
      correo_electronico: this.correo_electronico.trim(),
      contrasena: this.contrasena,
      telefono: this.telefono || undefined,
      direccion: this.direccion || undefined
    }).pipe(
      finalize(() => {
        this.cargando = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: () => {
        this.mensaje = '¡Tu cuenta fue creada correctamente! 💗';

        this.router.navigate(['/login']).then((navego) => {
          if (!navego) {
            this.error = 'Cuenta creada. Entra desde Iniciar sesión.';
            this.cdr.markForCheck();
          }
        });
      },

      error: (err) => {
        console.error('Error de registro:', err.status);

        this.error = typeof err.error?.detail === 'string'
          ? err.error.detail
          : 'No se pudo completar el registro.';

        this.cdr.markForCheck();
      }
    });
  }
}
