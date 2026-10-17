/**
 * Retiro en tienda / Pickup (F7 · RF-18, RF-19).
 *
 * Un solo archivo por dominio, como `api/caja.ts`. Con `VITE_USE_MOCKS=true` responde con pedidos
 * de ejemplo; con `false` se llama al backend real.
 *
 * Rutas del contrato (`api-contracts.md` §5.7): `GET /retail/pickup/pendientes` y
 * `POST /retail/pickup/{pedidoId}/entrega`.
 *
 * Los pedidos entregados se guardan en `sessionStorage` para que no reaparezcan en la bandeja al
 * recargar la página durante el turno.
 */
import { api, ApiError, USA_MOCKS } from './http'

export type EstadoPickup = 'LISTO_PARA_RECOJO' | 'EN_PREPARACION' | 'EN_CAMINO_A_TIENDA'

export interface ArticuloBulto {
  sku: string
  nombre: string
  talla: string
  color: string
  cantidad: number
}

export interface PedidoPickup {
  pedidoId: string
  clienteNombre: string
  clienteDni: string
  anaquelUbicacion: string
  fechaArriboTienda: string
  estado: EstadoPickup
  articulos: ArticuloBulto[]
}

export interface EntregaPickup {
  dniRecoge: string
  nombreRecoge: string
  esTerceroAutorizado: boolean
}

export interface ConstanciaEntrega {
  constanciaId: string
  fechaHoraEntrega: string
  estado: 'ENTREGADO'
}

/** RF-18: pedidos pickup de la tienda del vendedor que aún no se entregan. */
export function listarPickups(): Promise<PedidoPickup[]> {
  if (USA_MOCKS) return listarPickupsSimulados()
  return api.get<PedidoPickup[]>('/api/v1/retail/pickup/pendientes')
}

/** RF-19: registra la entrega física y devuelve la constancia digital. */
export function confirmarEntrega(pedidoId: string, entrega: EntregaPickup): Promise<ConstanciaEntrega> {
  if (USA_MOCKS) return confirmarEntregaSimulada(pedidoId, entrega)
  return api.post<ConstanciaEntrega>(`/api/v1/retail/pickup/${encodeURIComponent(pedidoId)}/entrega`, entrega)
}

export const totalPrendas = (articulos: ArticuloBulto[]) => articulos.reduce((suma, a) => suma + a.cantidad, 0)

// ---------------------------------------------------------------------------
// Pedidos de ejemplo mientras no exista el módulo de Ventas (G5)
// ---------------------------------------------------------------------------

const CLAVE_ENTREGADOS = 'retail.pickup.entregados'

const haceHoras = (horas: number) => new Date(Date.now() - horas * 3_600_000).toISOString()

const esperar = () => new Promise((resolver) => setTimeout(resolver, 250))

const PEDIDOS_EJEMPLO: PedidoPickup[] = [
  {
    pedidoId: 'PED-2026-08910',
    clienteNombre: 'María González',
    clienteDni: '45678912',
    anaquelUbicacion: 'Anaquel B-04',
    fechaArriboTienda: haceHoras(3),
    estado: 'LISTO_PARA_RECOJO',
    articulos: [{ sku: 'ZAP-RUN-41-BLANC', nombre: 'Zapatilla Running Pegasus 40', talla: '41', color: 'Blanco', cantidad: 1 }],
  },
  {
    pedidoId: 'PED-2026-08914',
    clienteNombre: 'Juan Pérez Torres',
    clienteDni: '72345678',
    anaquelUbicacion: 'Estante A - Casillero 14',
    fechaArriboTienda: haceHoras(5),
    estado: 'LISTO_PARA_RECOJO',
    articulos: [
      { sku: 'CAM-PERU-M-BLANC', nombre: 'Camiseta Selección 2026', talla: 'M', color: 'Blanco', cantidad: 2 },
      { sku: 'BAL-FUT-5-BLANC', nombre: 'Balón de Fútbol Match N.° 5', talla: '5', color: 'Blanco', cantidad: 1 },
    ],
  },
  {
    pedidoId: 'PED-2026-08897',
    clienteNombre: 'Rosa Quispe Huamán',
    clienteDni: '40123987',
    anaquelUbicacion: 'Anaquel C-11',
    fechaArriboTienda: haceHoras(27),
    estado: 'LISTO_PARA_RECOJO',
    articulos: [{ sku: 'LEG-TRA-S-NEGRO', nombre: 'Leggings Training Compresión', talla: 'S', color: 'Negro', cantidad: 1 }],
  },
  {
    pedidoId: 'PED-2026-08871',
    clienteNombre: 'Diego Flores Ccori',
    clienteDni: '70881234',
    anaquelUbicacion: 'Estante A - Casillero 02',
    fechaArriboTienda: haceHoras(50),
    estado: 'LISTO_PARA_RECOJO',
    articulos: [{ sku: 'CAS-OUT-L-VERDE', nombre: 'Casaca Cortaviento Trail', talla: 'L', color: 'Verde', cantidad: 1 }],
  },
  {
    pedidoId: 'PED-2026-08932',
    clienteNombre: 'Lucero Vargas Paz',
    clienteDni: '48765432',
    anaquelUbicacion: '',
    fechaArriboTienda: haceHoras(0),
    estado: 'EN_CAMINO_A_TIENDA',
    articulos: [{ sku: 'MOC-OUT-30L-GRIS', nombre: 'Mochila Trekking 30 L', talla: '30L', color: 'Gris', cantidad: 1 }],
  },
]

function leerEntregados(): string[] {
  try {
    const crudo = window.sessionStorage.getItem(CLAVE_ENTREGADOS)
    return crudo ? (JSON.parse(crudo) as string[]) : []
  } catch {
    return []
  }
}

function guardarEntregados(entregados: string[]): void {
  try {
    window.sessionStorage.setItem(CLAVE_ENTREGADOS, JSON.stringify(entregados))
  } catch {
    // Modo privado o almacenamiento bloqueado: la bandeja sigue funcionando en memoria.
  }
}

async function listarPickupsSimulados(): Promise<PedidoPickup[]> {
  await esperar()
  const entregados = leerEntregados()
  return PEDIDOS_EJEMPLO.filter((pedido) => !entregados.includes(pedido.pedidoId))
}

async function confirmarEntregaSimulada(pedidoId: string, entrega: EntregaPickup): Promise<ConstanciaEntrega> {
  await esperar()
  if (!/^\d{8}$/.test(entrega.dniRecoge) || !entrega.nombreRecoge.trim()) {
    throw new ApiError(400, {
      code: 'PARAMETRO_INVALIDO',
      detail: 'El DNI de quien recoge debe tener 8 dígitos y el nombre no puede estar vacío',
    })
  }
  const entregados = leerEntregados()
  const pedido = PEDIDOS_EJEMPLO.find((p) => p.pedidoId === pedidoId)
  if (!pedido || pedido.estado !== 'LISTO_PARA_RECOJO' || entregados.includes(pedidoId)) {
    throw new ApiError(409, {
      code: 'PEDIDO_NO_LISTO_PARA_RECOJO',
      detail: 'El paquete no figura en estado listo para recojo',
    })
  }
  guardarEntregados([...entregados, pedidoId])
  return { constanciaId: `CONST-${pedidoId}`, fechaHoraEntrega: new Date().toISOString(), estado: 'ENTREGADO' }
}
