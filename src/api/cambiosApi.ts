/**
 * Cambios de prenda y vales de compra en mostrador (F9 · RF-23, RF-24, RF-25).
 *
 * A diferencia de otros dominios, F9 **no tiene mock en el navegador**: siempre llama al backend de
 * Retail. Las boletas y los vales son datos propios de Retail que se guardan en Supabase, y simularlos
 * aquí dejaría de demostrar justo eso. En desarrollo, el perfil `mock` del backend trae boletas de
 * prueba (`B001-00000045` en plazo y `B001-00000012` vencida).
 *
 * Rutas: `GET /api/v1/retail/cambios/validar/{boletaNumero}` y `POST /api/v1/retail/cambios`.
 */
import { api } from './http'

export type MotivoCambio = 'CAMBIO_TALLA' | 'CAMBIO_MODELO' | 'FALLA_FABRICA'

export interface InspeccionPrenda {
  etiquetasIntactas: boolean
  sinSignosUso: boolean
  empaqueOriginal: boolean
}

export interface ItemCambiable {
  sku: string
  descripcion: string
  precioPagado: number
  cantidadComprada: number
  cantidadDisponibleCambio: number
}

export interface ValidacionCambio {
  boletaNumero: string
  pedidoId?: string
  fechaEmision: string
  diasTranscurridos: number
  plazoDias: number
  plazoValido: boolean
  items: ItemCambiable[]
}

export interface RegistroCambio {
  boletaNumero: string
  sku: string
  cantidad: number
  motivo: MotivoCambio
  inspeccion: InspeccionPrenda
  clienteId?: string
}

export interface ValeCompra {
  codigoVale: string
  monto: number
  codigoBarras: string
  boletaOrigen: string
  fechaEmision: string
  fechaVencimiento: string
  estado: 'EMITIDO' | 'CANJEADO' | 'ANULADO'
}

export interface CambioRegistrado {
  solicitudId: string
  estadoAprobacion: 'APROBADO_EN_TIENDA'
  destinoSugerido?: 'REINGRESO_INVENTARIO' | 'MERMA_GARANTIA'
  montoAcreditado: number
  observaciones: string[]
  vale: ValeCompra
}

/** Serie de una letra y tres dígitos, guion y correlativo de 8 dígitos: `B001-00000045`. */
const FORMATO_BOLETA = /^B001-[0-9]{8}$/

/** Normaliza lo que entrega el lector o el teclado: sin espacios y en mayúsculas. */
export function normalizarBoleta(texto: string): string {
  return texto.trim().toUpperCase()
}

export function esBoletaValida(texto: string): boolean {
  return FORMATO_BOLETA.test(normalizarBoleta(texto))
}

export function validarBoleta(boletaNumero: string): Promise<ValidacionCambio> {
  return api.get<ValidacionCambio>(
    `/api/v1/retail/cambios/validar/${encodeURIComponent(normalizarBoleta(boletaNumero))}`,
  )
}

/**
 * Registra el cambio y emite el vale.
 *
 * La `claveIdempotencia` debe generarse **una vez por intento de cambio** y reutilizarse si se
 * reintenta: así un doble clic o un corte de red no emite dos vales por la misma prenda.
 */
export function registrarCambio(cambio: RegistroCambio, claveIdempotencia: string): Promise<CambioRegistrado> {
  return api.post<CambioRegistrado>('/api/v1/retail/cambios', cambio, {
    'Idempotency-Key': claveIdempotencia,
  })
}
