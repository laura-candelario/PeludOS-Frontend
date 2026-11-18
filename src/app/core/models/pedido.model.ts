
export interface PedidoCreate {
  direccion_entrega: string;
  metodo_pago: string | null;
  notas: string | null;
}

export interface Pedido {
  id_pedido: number;
  id_usuario: number;
  id_veterinaria: number;
  id_carrito: number;
  fecha_pedido: string;
  total: string | number;
  estado_pedido: string;

  metodo_pago: string | null;
  direccion_entrega: string;
  notas: string | null;
  fecha_entrega: string | null;
}
