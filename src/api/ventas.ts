import { api, ApiError } from './http'

export type MedioPago = 'EFECTIVO' | 'TARJETA_POS'
export type TipoComprobante = 'BOLETA' | 'FACTURA'

export interface VentaRequest {
  terminalPos: string
  turnoId: string
  clienteId?: string
  items: { sku: string; cantidad: number }[]
  cupon?: string
  pago: {
    medioPago: MedioPago
    montoRecibidoEfectivo?: number
    montoTarjeta?: number
    referenciaOperacion?: string
  }
  comprobante: { tipo: TipoComprobante; numeroDocumento?: string; razonSocial?: string }
  emitirTicketRegalo: boolean
}

interface VentaResponse {
  pedidoId: string
  pago: { medioPago: MedioPago; montoRecibido: number; vuelto: number }
  comprobante: {
    tipo: TipoComprobante
    serie: string
    correlativo: string
    subtotal: number
    igv: number
    total: number
    fechaEmision: string
    qr: string
  }
  items: { sku: string; cantidad: number; precioFinal: number }[]
  ticketRegalo?: { codigoCanje: string; fechaLimiteCambio: string }
}

export function registrarVenta(peticion: VentaRequest, clave: string) {
  return api.post<VentaResponse>('/api/v1/retail/ventas', peticion, { 'Idempotency-Key': clave })
}

/** Pausa antes de repetir el cobro, para dar tiempo a que Ventas termine de confirmarlo. */
const ESPERA_REINTENTO_MS = 1500

const esperarReintento = () => new Promise<void>((resolver) => setTimeout(resolver, ESPERA_REINTENTO_MS))

/**
 * F5 · RF-14: registra la venta y, si Retail responde `503 VENTAS_NO_DISPONIBLE` (Ventas no confirmó
 * a tiempo), la repite una vez con la misma `Idempotency-Key`. La clave garantiza que no se cree un
 * segundo pedido; si tampoco se confirma, el error vuelve al cajero para reintentar.
 */
export async function registrarVentaConReintento(
  peticion: VentaRequest,
  clave: string,
  esperar: () => Promise<void> = esperarReintento,
) {
  try {
    return await registrarVenta(peticion, clave)
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 503) throw error
    await esperar()
    return registrarVenta(peticion, clave)
  }
}
