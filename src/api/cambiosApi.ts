/**
 * Cambio directo de prenda en mostrador (F9 · RF-23, RF-24, RF-25; contrato §5.9).
 *
 * Desde la Semana 14 reemplaza al vale: el cliente devuelve una prenda y se lleva otra en el momento,
 * pagando la diferencia si cuesta más.
 *
 * A diferencia de otros dominios, F9 **no tiene mock en el navegador**: siempre llama al backend de
 * Retail. Las boletas y los cambios son datos propios de Retail que se guardan en Supabase, y
 * simularlos aquí dejaría de demostrar justo eso. En desarrollo, el perfil `mock` del backend trae boletas de
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

export type MedioPagoDiferencia = 'EFECTIVO' | 'TARJETA_POS'

/** Cuerpo de `POST /api/v1/retail/cambios` (contrato §5.9). */
export interface CambioDirecto {
  boletaNumero: string
  terminalPos: string
  turnoId: string
  motivo: MotivoCambio
  devuelto: { sku: string; cantidad: number; inspeccion: InspeccionPrenda }
  nuevos: { sku: string; cantidad: number }[]
  /** Solo en mayor valor, con las reglas del pago de F5. */
  pagoDiferencia: {
    medioPago: MedioPagoDiferencia
    montoRecibidoEfectivo?: number
    montoTarjeta?: number
    referenciaOperacion?: string
  } | null
  /** Solo en mayor valor. */
  comprobante: { tipo: 'BOLETA'; numeroDocumento?: string } | null
  clienteId: string | null
}

export type TipoCambio = 'MISMO_VALOR' | 'MAYOR_VALOR'

export interface PrendaCambio {
  sku: string
  cantidad: number
  precioUnitario: number
}

/** Respuesta 201: en mismo valor, `pago` y `comprobante` llegan en `null`. */
export interface CambioRegistrado {
  cambioId: string
  numeroConstancia: string
  tipoCambio: TipoCambio
  boletaOrigen: string
  montoCredito: number
  totalNuevo: number
  diferencia: number
  pago: { medioPago: MedioPagoDiferencia; montoRecibido: number; vuelto: number } | null
  comprobante: { tipo: string; serie: string; correlativo: string; total: number; fechaEmision: string } | null
  pedidoId: string | null
  estadoInventario: 'PENDIENTE' | 'CONFIRMADO'
  fechaCambio: string
  devuelto: PrendaCambio
  nuevos: PrendaCambio[]
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
 * Registra el cambio directo.
 *
 * La `claveIdempotencia` debe generarse **una vez por intento de cambio** y reutilizarse si se
 * reintenta: así un doble clic o un corte de red no cambia dos veces la misma prenda ni cobra dos
 * veces la diferencia.
 */
export function registrarCambio(cambio: CambioDirecto, claveIdempotencia: string): Promise<CambioRegistrado> {
  return api.post<CambioRegistrado>('/api/v1/retail/cambios', cambio, {
    'Idempotency-Key': claveIdempotencia,
  })
}
