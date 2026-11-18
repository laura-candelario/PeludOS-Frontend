
export interface MascotaRequest {
  nombre: string;
  especie: string;
  raza: string;
  sexo: string;
  fecha_nacimiento: string;
  peso_kg: number;
  color_mascota: string;
  numero_chip: string;
  foto_url: string;
  alergias: string;
  condiciones_medicas: string;
}

export interface Mascota extends MascotaRequest {
  id_mascota?: number;
  id_usuario?: number;
}
