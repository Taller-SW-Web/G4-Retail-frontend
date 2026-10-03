import { http } from '../api/http'
import type {
  AltaClienteRequest,
  CarritoEspera,
  CatalogoQuery,
  CatalogoResponse,
  CierreCajaResponse,
  ClienteBusqueda,
  ClienteCreado,
  ClienteVenta,
  ConfirmarEntregaRequest,
  ConfirmarEntregaResponse,
  EstadoCaja,
  FinalizarVentaRequest,
  FinalizarVentaResponse,
  ItemCarrito,
  LoginResponse,
  PedidoPickup,
} from '../types'

export const TERMINAL_POS: string = import.meta.env.VITE_TERMINAL_POS ?? 'POS-01'

// F1 — Inicio de sesión
export const login = (email: string, password: string) =>
  http<LoginResponse>('POST', '/api/v1/auth/login', { email, password })

// F2 — Catálogo
export function buscarCatalogo(filtros: CatalogoQuery) {
  const params = new URLSearchParams(Object.entries(filtros).filter(([, valor]) => valor) as [string, string][])
  return http<CatalogoResponse>('GET', `/api/v1/retail/catalogo/buscar?${params}`)
}

// F3 — Clientes
export const buscarCliente = (documento: string) =>
  http<ClienteBusqueda>('POST', '/api/v1/retail/clientes/buscar', { documento })

export const registrarCliente = (alta: AltaClienteRequest) =>
  http<ClienteCreado>('POST', '/api/v1/retail/clientes/registro-rapido', alta)

// F4 — Carritos en espera
export const listarCarritosEspera = () => http<CarritoEspera[]>('GET', '/api/v1/retail/carritos-espera')

export const pausarCarrito = (aliasTicket: string, items: ItemCarrito[], cliente: ClienteVenta | null) =>
  http<CarritoEspera>('POST', '/api/v1/retail/carritos-espera', { aliasTicket, items, cliente })

export const eliminarCarritoEspera = (id: string) => http<void>('DELETE', `/api/v1/retail/carritos-espera/${id}`)

// F5 — Pago y comprobante
export const finalizarVenta = (venta: FinalizarVentaRequest) =>
  http<FinalizarVentaResponse>('POST', '/api/v1/retail/ventas/finalizar', venta)

// F7 — Pickup
export const listarPickups = () => http<PedidoPickup[]>('GET', '/api/v1/retail/pickup/pendientes')

export const confirmarEntrega = (entrega: ConfirmarEntregaRequest) =>
  http<ConfirmarEntregaResponse>('POST', '/api/v1/retail/pickup/confirmar', entrega)

// F8 — Caja
export const estadoCaja = () => http<EstadoCaja>('GET', '/api/v1/retail/caja/estado-actual')

export const abrirCaja = (saldoInicialEfectivo: number) =>
  http<{ sesionId: string; estado: 'ABIERTA'; fechaHoraApertura: string }>('POST', '/api/v1/retail/caja/apertura', {
    terminalPos: TERMINAL_POS,
    saldoInicialEfectivo,
  })

export const cerrarCaja = (montoDeclarado: number, observaciones: string) =>
  http<CierreCajaResponse>('POST', '/api/v1/retail/caja/cierre', { montoDeclarado, observaciones })
