import type { Rol } from '../types'

const TODOS: Rol[] = ['VENDEDOR', 'CAJERO', 'SUPERVISOR']

/** RF-02: roles locales que pueden entrar a cada ruta de la terminal. */
export const ROLES_POR_RUTA = {
  '/pos': TODOS,
  '/pickup': TODOS,
  '/caja/cierre': ['CAJERO', 'SUPERVISOR'],
} satisfies Record<string, Rol[]>

export const puedeAcceder = (rol: Rol, ruta: keyof typeof ROLES_POR_RUTA) => (ROLES_POR_RUTA[ruta] as Rol[]).includes(rol)

export const ACCESO_RESTRINGIDO = 'Acceso Restringido: Sus credenciales no cuentan con los privilegios requeridos'
