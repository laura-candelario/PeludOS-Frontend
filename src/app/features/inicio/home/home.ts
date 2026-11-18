
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css', './home-dashboard.css']
})
export class Home {

  private auth = inject(AuthService);
  private router = inject(Router);

  anioActual = new Date().getFullYear();

  // Comprobar si hay una sesión iniciada
  get estaAutenticado(): boolean {
    return this.auth.estaAutenticado();
  }

  // Cerrar sesión solamente cuando el usuario lo solicite
  cerrarSesion(): void {
    this.auth.cerrarSesion();
    this.router.navigateByUrl('/login');
  }
}
