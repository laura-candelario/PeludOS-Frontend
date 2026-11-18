
import { Routes } from '@angular/router';

import { Registro } from './features/auth/registro/registro';
import { Login } from './features/auth/login/login';
import { MiPerfil } from './features/perfil/mi-perfil/mi-perfil';
import { Home } from './features/inicio/home/home';
import { MisMascotas } from './features/mascotas/mis-mascotas/mis-mascotas';
import { ListadoVeterinarias } from './features/veterinarias/listado-veterinarias/listado-veterinarias';
import { Catalogo } from './features/tienda/catalogo/catalogo';
import { Carrito } from './features/tienda/carrito/carrito';
import { MisPedidos } from './features/pedidos/mis-pedidos/mis-pedidos';
import { FinalizarCompra } from './features/pedidos/finalizar-compra/finalizar-compra';

export const routes: Routes = [
  {
    path: 'registro',
    component: Registro
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'home',
    component: Home
  },
  {
    path: 'perfil',
    component: MiPerfil
  },
  {
    path: 'mascotas',
    component: MisMascotas
  },
  {
    path: 'veterinarias',
    component: ListadoVeterinarias
  },
  {
    path: 'tienda',
    component: Catalogo
  },
  {
    path: 'carrito',
    component: Carrito
  },
  {
    path: 'pedidos',
    component: MisPedidos
  },
  {
    path: 'finalizar-compra',
    component: FinalizarCompra
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

