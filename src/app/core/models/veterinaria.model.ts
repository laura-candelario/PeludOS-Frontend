
export interface Veterinaria {
  id_veterinaria: number;
  nombre_comercial: string;
  direccion: string;
  telefono: string | null;
  correo_electronico: string | null;
  horario_atencion: string | null;
  latitud: string | number | null;
  longitud: string | number | null;
  calificacion_promedio: string | number | null;
  activo: boolean;
}
