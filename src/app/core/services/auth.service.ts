
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { API_URL } from '../api.config';

import {
  RegistroRequest,
  LoginRequest,
  TokenResponse,
  Usuario
} from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  private readonly TOKEN_KEY = 'peludos_token';

  // ====================================
  // REGISTRAR USUARIO
  // ====================================
  registrar(datos: RegistroRequest): Observable<Usuario> {
    return this.http.post<Usuario>(
      `${API_URL}/auth/register`,
      datos
    ).pipe(
      tap({
        next: () => console.log('Registro completado'),
        error: (err) => console.error(
          'Error de registro:',
          err.status
        )
      })
    );
  }

  // ====================================
  // INICIAR SESIÓN
  // ====================================
  login(datos: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(
      `${API_URL}/auth/login`,
      datos
    );
  }

  // ====================================
  // GUARDAR TOKEN
  // ====================================
  guardarToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  // ====================================
  // OBTENER TOKEN GUARDADO
  // ====================================
  obtenerToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  // ====================================
  // CONSULTAR PERFIL DEL USUARIO
  // ====================================
  obtenerPerfil(token: string): Observable<Usuario> {
    return this.http.get<Usuario>(
      `${API_URL}/usuarios/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }

  // ====================================
  // COMPROBAR SI EXISTE UNA SESIÓN
  // ====================================
  estaAutenticado(): boolean {
    return this.obtenerToken() !== null;
  }

  // ====================================
  // CERRAR SESIÓN
  // ====================================
  cerrarSesion(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }
}
