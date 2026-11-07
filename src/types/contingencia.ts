export type EstadoVentaOffline =
  | 'PENDIENTE'
  | 'RESINCRONIZADO'
  | 'REQUIERE_REVISION'
  | 'RECHAZADO'

export interface ItemVentaOffline {
  sku: string
  cantidad: number
  precioUnitario: number
}

export interface VentaOfflineRegistro {
  ventaLocalUuid: string
  terminalPos: string
  turnoId: string
  correlativoContingencia: string
  fechaHoraOffline: string
  items: ItemVentaOffline[]
  totalNeto: number
  efectivoRecibido: number
  vuelto: number
  clienteId: string | null
  hashIntegridad: string
  estado: EstadoVentaOffline
  // Campos de conciliación devueltos por el backend
  pedidoId?: string | null
  comprobante?: string | null
  error?: string | null
  // Metadatos para comprobante visual
  itemsDetalle?: Array<{
    sku: string
    nombre: string
    talla: string
    color: string
    cantidad: number
    precioUnitario: number
  }>
  clienteDetalle?: {
    id: string
    nombre: string
    tipoDocumento: string
    numeroDocumento: string
  }
  vendedor?: string
}

export interface SincronizacionOfflineRequestPayload {
  terminalPos: string
  turnoId: string
  lote: Array<{
    ventaLocalUuid: string
    correlativoContingencia: string
    fechaHoraOffline: string
    items: ItemVentaOffline[]
    totalNeto: number
    efectivoRecibido: number
    vuelto: number
    clienteId?: string | null
    hashIntegridad: string
  }>
}

export interface ResultadoSincronizacion {
  ventaLocalUuid: string
  estado: 'RESINCRONIZADO' | 'DUPLICADO' | 'REQUIERE_REVISION' | 'RECHAZADO'
  pedidoId?: string | null
  comprobante?: string | null
  motivo?: string | null
}

export interface SincronizacionOfflineResponsePayload {
  totalProcesados: number
  resultados: ResultadoSincronizacion[]
}
