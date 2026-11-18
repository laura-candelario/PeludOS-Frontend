
export interface AgregarCarritoRequest {
  id_producto: number;
  cantidad: number;
}

export interface ActualizarCantidadRequest {
  cantidad: number;
}

export interface DetalleCarrito {
  id_detalle_carrito: number;
  id_carrito: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: string | number;
  subtotal: string | number;
}

export interface Carrito {
  id_carrito: number;
  id_usuario: number;
  estado: string;
  fecha_creacion: string;
  detalles: DetalleCarrito[];
  total: string | number;
}
