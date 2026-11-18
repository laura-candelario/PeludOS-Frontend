
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { VeterinariasService } from '../../../core/services/veterinarias.service';
import { Veterinaria } from '../../../core/models/veterinaria.model';

@Component({
  selector: 'app-listado-veterinarias',
  imports: [FormsModule, RouterLink],
  templateUrl: './listado-veterinarias.html',
  styleUrl: './listado-veterinarias.css'
})
export class ListadoVeterinarias implements OnInit {

  private veterinariasService = inject(VeterinariasService);
  private cdr = inject(ChangeDetectorRef);

  veterinarias: Veterinaria[] = [];
  veterinariaSeleccionada: Veterinaria | null = null;

  busqueda = '';
  cargando = true;
  cargandoDetalle = false;
  error = '';
  errorDetalle = '';

  ngOnInit(): void {
    this.cargarVeterinarias();
  }

  cargarVeterinarias(): void {
    this.cargando = true;
    this.error = '';

    this.veterinariasService.listarVeterinarias().subscribe({
      next: (respuesta) => {
        this.veterinarias = respuesta;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(
          'Error al listar veterinarias:',
          err.status
        );

        this.error =
          'No pudimos cargar las veterinarias. ' +
          'Comprueba que FastAPI esté funcionando.';

        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  get veterinariasFiltradas(): Veterinaria[] {
    const texto = this.busqueda
      .trim()
      .toLocaleLowerCase();

    if (!texto) {
      return this.veterinarias;
    }

    return this.veterinarias.filter((veterinaria) => {
      const nombre = veterinaria.nombre_comercial ?? '';
      const direccion = veterinaria.direccion ?? '';

      return (
        nombre.toLocaleLowerCase().includes(texto) ||
        direccion.toLocaleLowerCase().includes(texto)
      );
    });
  }

  verDetalles(veterinaria: Veterinaria): void {
    this.cargandoDetalle = true;
    this.errorDetalle = '';
    this.veterinariaSeleccionada = null;

    this.veterinariasService
      .obtenerVeterinaria(veterinaria.id_veterinaria)
      .subscribe({
        next: (respuesta) => {
          this.veterinariaSeleccionada = respuesta;
          this.cargandoDetalle = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error(
            'Error al consultar veterinaria:',
            err.status
          );

          this.errorDetalle =
            'No pudimos consultar los detalles.';

          this.cargandoDetalle = false;
          this.cdr.markForCheck();
        }
      });
  }

  cerrarDetalles(): void {
    this.veterinariaSeleccionada = null;
    this.errorDetalle = '';
  }

  obtenerMapa(veterinaria: Veterinaria): string {
    const latitud = Number(veterinaria.latitud);
    const longitud = Number(veterinaria.longitud);

    const tieneCoordenadas =
      veterinaria.latitud != null &&
      veterinaria.longitud != null &&
      Number.isFinite(latitud) &&
      Number.isFinite(longitud) &&
      latitud >= -90 &&
      latitud <= 90 &&
      longitud >= -180 &&
      longitud <= 180 &&
      !(latitud === 0 && longitud === 0);

    if (tieneCoordenadas) {
      return 'https://www.google.com/maps/search/?api=1&query=' +
        encodeURIComponent(`${latitud},${longitud}`);
    }

    return 'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent(veterinaria.direccion || veterinaria.nombre_comercial);
  }
}
