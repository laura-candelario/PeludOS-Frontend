
export interface Producto {
  id_producto: number;
  id_veterinaria: number;

  nombre_producto: string;
  descripcion: string | null;
  categoria: string | null;

  precio_compra: number | string;
  precio_venta: number | string;

  stock: number;
  unidad_medida: string | null;
  imagen_url: string | null;

  activo?: boolean;
}
