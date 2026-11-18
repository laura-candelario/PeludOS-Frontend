
import {
  Component,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  correo_electronico = '';
  contrasena = '';

  mensaje = '';
  error = '';
  cargando = false;

  iniciarSesion(): void {

    if (this.cargando) return;

    this.mensaje = '';
    this.error = '';

    if (!this.correo_electronico.trim() || !this.contrasena) {
      this.error = 'Ingresa tu correo y contraseña.';
      return;
    }

    this.cargando = true;

    this.authService.login({
      correo_electronico: this.correo_electronico.trim(),
      contrasena: this.contrasena
    }).pipe(
      finalize(() => {
        this.cargando = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (respuesta) => {

        if (!respuesta.access_token) {
          this.error = 'El servidor no devolvió un token.';
          this.cdr.markForCheck();
          return;
        }

        this.authService.guardarToken(respuesta.access_token);

        this.contrasena = '';

        this.router.navigate(['/perfil']).then((navego) => {
          if (!navego) {
            this.error = 'No se pudo abrir tu perfil.';
            this.cdr.markForCheck();
          }
        });
      },

      error: (err) => {
        this.error = typeof err.error?.detail === 'string'
          ? err.error.detail
          : 'No se pudo iniciar sesión.';

        this.cdr.markForCheck();
      }
    });
  }
}
