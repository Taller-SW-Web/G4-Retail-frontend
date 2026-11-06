import { api } from './http'

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
