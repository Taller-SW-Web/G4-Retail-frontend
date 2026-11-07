/**
 * Consulta y seguimiento histórico de pedidos (F6 · RF-16, RF-17).
 *
 * Rutas del contrato (`api-contracts.md` §5.6): `GET /retail/pedidos` y `GET /retail/pedidos/{pedidoId}`.
 * Con `VITE_USE_MOCKS=true` responde con pedidos de ejemplo y las mismas reglas que el backend.
 */
import { api, ApiError, USA_MOCKS } from './http'

/** Estados oficiales de Ventas (G5). Se acepta cualquier texto por si Ventas agrega uno nuevo. */
export type EstadoPedido = 'CREADO' | 'PAGADO' | 'EN_PREPARACION' | 'DESPACHADO' | 'ENTREGADO' | 'ANULADO'

export interface PedidoResumen {
  pedidoId: string
  canal: string
  /** ISO-8601 con la hora de Lima. */
  fechaCreacion: string
  estadoComercial: EstadoPedido | string
  total: number
}

export interface PaginaPedidos {
  items: PedidoResumen[]
  page: number
  size: number
  total: number
}

export interface LineaPedido {
  sku: string
  nombre?: string
  /** Ventas aún no publica talla ni color: pueden venir vacíos. */
  talla?: string
  color?: string
  cantidad: number
  precioUnitario?: number
  subtotal?: number
}

export interface EventoEstado {
  estado: EstadoPedido | string
  fecha: string
  motivo?: string
}

export interface DetallePedido {
  pedidoId: string
  canal: string
  tipo?: string
  estadoComercial: EstadoPedido | string
  estadoPago?: string
  modalidad?: string
  tiendaId?: string
  cliente?: { nombre?: string; tipoDocumento?: string; numeroDocumento?: string }
  total?: number
  moneda?: string
  metodoPago?: string
  fechaCreacion?: string
  ultimaActualizacion?: string
  lineas: LineaPedido[]
  /** Orden cronológico ascendente. */
  historialEstados: EventoEstado[]
}

export type FiltroPedidos = { codigoPedido: string } | { documentoCliente: string }

/** Query string del contrato: un solo filtro, más `page` y `size` (§2.7). */
export function consultaPedidos(filtro: FiltroPedidos, page = 0, size = 20): string {
  const parametros = new URLSearchParams()
  if ('codigoPedido' in filtro) parametros.set('codigoPedido', filtro.codigoPedido.trim())
  else parametros.set('documentoCliente', filtro.documentoCliente.trim())
  parametros.set('page', String(page))
  parametros.set('size', String(size))
  return parametros.toString()
}

/** RF-16: pedidos por código o por DNI/RUC, del más reciente al más antiguo. `404` si no hay ninguno. */
export function buscarPedidos(filtro: FiltroPedidos, page = 0, size = 20): Promise<PaginaPedidos> {
  if (USA_MOCKS) return buscarPedidosSimulados(filtro, page, size)
  return api.get<PaginaPedidos>(`/api/v1/retail/pedidos?${consultaPedidos(filtro, page, size)}`)
}

/** RF-17: detalle con prendas e historial de estados. */
export function obtenerPedido(pedidoId: string): Promise<DetallePedido> {
  if (USA_MOCKS) return obtenerPedidoSimulado(pedidoId)
  return api.get<DetallePedido>(`/api/v1/retail/pedidos/${encodeURIComponent(pedidoId.trim())}`)
}

// ---------------------------------------------------------------------------
// Pedidos de ejemplo para VITE_USE_MOCKS=true (mismas reglas que el backend)
// ---------------------------------------------------------------------------

const esperar = () => new Promise((resolver) => setTimeout(resolver, 250))

/** Fecha ISO en hora de Lima, `horas` antes de ahora. */
const haceHoras = (horas: number) => {
  const lima = new Date(Date.now() - horas * 3_600_000 - 5 * 3_600_000)
  return lima.toISOString().replace(/\.\d{3}Z$/, '-05:00')
}

function ejemplo(
  pedidoId: string,
  canal: string,
  cliente: DetallePedido['cliente'],
  modalidad: string,
  tiendaId: string | undefined,
  horas: number,
  lineas: LineaPedido[],
  estados: EstadoPedido[],
): DetallePedido {
  const paso = horas / estados.length
  const historialEstados = estados.map((estado, i) => ({
    estado,
    fecha: haceHoras(horas - i * paso),
    ...(estado === 'ANULADO' ? { motivo: 'Solicitado por el cliente' } : {}),
  }))
  const total = lineas.reduce((suma, l) => suma + (l.subtotal ?? 0), 0)
  return {
    pedidoId,
    canal,
    tipo: 'VENTA',
    estadoComercial: estados[estados.length - 1],
    estadoPago: 'CONFIRMADO',
    modalidad,
    tiendaId,
    cliente,
    total,
    moneda: 'PEN',
    metodoPago: canal === 'RETAIL' ? 'EFECTIVO' : 'TARJETA',
    fechaCreacion: historialEstados[0].fecha,
    ultimaActualizacion: historialEstados[historialEstados.length - 1].fecha,
    lineas,
    historialEstados,
  }
}

const linea = (sku: string, nombre: string, cantidad: number, precio: number): LineaPedido => ({
  sku,
  nombre,
  cantidad,
  precioUnitario: precio,
  subtotal: Math.round(precio * cantidad * 100) / 100,
})

const JUAN = { nombre: 'Juan Pérez Torres', tipoDocumento: 'DNI', numeroDocumento: '72345678' }
const MARIA = { nombre: 'María González', tipoDocumento: 'DNI', numeroDocumento: '45678912' }

const PEDIDOS_EJEMPLO: DetallePedido[] = [
  ejemplo('PED-2026-00412', 'RETAIL', JUAN, 'TIENDA', 'TIENDA-MIRAFLORES', 2,
    [linea('ZAPVEL-41-AZU', 'Zapatillas Velocity X', 1, 249), linea('TOPPRO-M-NEG', 'Top de compresión Pro', 2, 89)],
    ['PAGADO', 'ENTREGADO']),
  ejemplo('PED-2026-00398', 'MARKETPLACE', JUAN, 'DOMICILIO', undefined, 30,
    [linea('TOPPRO-S-NEG', 'Top de compresión Pro', 1, 89)],
    ['CREADO', 'PAGADO', 'EN_PREPARACION', 'DESPACHADO']),
  ejemplo('PED-2026-00377', 'CHATBOT', JUAN, 'DOMICILIO', undefined, 120,
    [linea('ZAPVEL-38-NEG', 'Zapatillas Velocity X', 1, 249)],
    ['CREADO', 'PAGADO', 'ANULADO']),
  ejemplo('PED-2026-00405', 'MARKETPLACE', MARIA, 'RECOJO_TIENDA', 'TIENDA-MIRAFLORES', 20,
    [linea('TOPPRO-M-NEG', 'Top de compresión Pro', 1, 89)],
    ['CREADO', 'PAGADO', 'EN_PREPARACION']),
]

const noEncontrado = () =>
  new ApiError(404, { code: 'PEDIDO_NO_ENCONTRADO', detail: 'No se encontraron pedidos con los criterios indicados' })

async function buscarPedidosSimulados(filtro: FiltroPedidos, page: number, size: number): Promise<PaginaPedidos> {
  await esperar()
  const encontrados =
    'codigoPedido' in filtro
      ? PEDIDOS_EJEMPLO.filter((p) => p.pedidoId === filtro.codigoPedido.trim())
      : PEDIDOS_EJEMPLO.filter((p) => p.cliente?.numeroDocumento === filtro.documentoCliente.trim())
  if (encontrados.length === 0) throw noEncontrado()
  const items = encontrados
    .map(({ pedidoId, canal, fechaCreacion, estadoComercial, total }) => ({
      pedidoId,
      canal,
      fechaCreacion: fechaCreacion ?? '',
      estadoComercial,
      total: total ?? 0,
    }))
    .sort((a, b) => Date.parse(b.fechaCreacion) - Date.parse(a.fechaCreacion))
  return { items: items.slice(page * size, page * size + size), page, size, total: items.length }
}

async function obtenerPedidoSimulado(pedidoId: string): Promise<DetallePedido> {
  await esperar()
  const pedido = PEDIDOS_EJEMPLO.find((p) => p.pedidoId === pedidoId.trim())
  if (!pedido) throw noEncontrado()
  return pedido
}
