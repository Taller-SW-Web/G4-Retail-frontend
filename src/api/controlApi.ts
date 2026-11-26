/**
 * Torre de control del turno (F11 · RF-29, RF-30, RF-31).
 *
 * Rutas del contrato (`api-contracts.md` §5.11): `GET /api/v1/retail/control/*`. La tienda sale del
 * perfil del vendedor. Con `VITE_USE_MOCKS=true` responde con los ejemplos del propio contrato.
 */
import { api, USA_MOCKS } from './http'
import type { PedidoPickup } from './pickupApi'

/** Fuentes que el resumen puede reportar caídas sin responder 503. */
export type FuenteControl = 'VENTAS_G5' | 'PRODUCTOS_G6'

export interface ResumenControl {
  /** `null` si su fuente no respondió: no es lo mismo que cero. */
  pickupPendientes: number | null
  stockCritico: number | null
  campanasVigentes: number | null
  fuentesNoDisponibles: FuenteControl[]
  actualizadoEn: string
}

export type NivelStock = 'AGOTADO' | 'CRITICO'

export interface VarianteCritica {
  sku: string
  productoId: string
  nombreProducto: string
  talla: string | null
  color: string | null
  nivel: NivelStock
  /** Puede venir `null`: Productos no expone cantidades a los canales (X-P0-03). */
  stockTienda: number | null
  disponibleEnCentral: boolean | null
  stockCentral: number | null
}

export type TipoDescuento = 'PORCENTAJE' | 'MONTO_FIJO' | 'NXM'

export interface CampanaVigente {
  campanaId: string
  titulo: string
  descripcion: string | null
  /** `tipoDescuento`, `valor`, `codigoCupon` y `montoMinimo` pueden faltar: G6 no siempre los publica. */
  tipoDescuento: TipoDescuento | null
  valor: number | null
  codigoCupon: string | null
  montoMinimo: number | null
  condiciones: string | null
  vigenteDesde: string
  vigenteHasta: string
}

/** El badge de la campana consulta el resumen cada 60 s (contrato §5.11). */
export const INTERVALO_RESUMEN_MS = 60_000

/** Suma de alertas para el badge. Un contador `null` no suma: su fuente no respondió. */
export const totalAlertas = (resumen: ResumenControl | null) =>
  resumen ? (resumen.pickupPendientes ?? 0) + (resumen.stockCritico ?? 0) + (resumen.campanasVigentes ?? 0) : 0

/** Contadores para el badge de la campana. */
export function obtenerResumen(): Promise<ResumenControl> {
  if (USA_MOCKS) return simular(resumenSimulado)
  return api.get<ResumenControl>('/api/v1/retail/control/resumen')
}

/** RF-29: variantes agotadas o críticas en la tienda, primero las agotadas. */
export function listarStockCritico(): Promise<VarianteCritica[]> {
  if (USA_MOCKS) return simular(() => STOCK_CRITICO_EJEMPLO)
  return api.get<VarianteCritica[]>('/api/v1/retail/control/stock-critico')
}

/** RF-30: pickups `LISTO_PARA_RECOJO` de la tienda. Con `dni` deja solo los de ese titular. */
export function listarPickupsDelDia(dni?: string): Promise<PedidoPickup[]> {
  const filtro = dni?.trim()
  if (USA_MOCKS) return simular(() => PICKUPS_EJEMPLO.filter((p) => !filtro || p.clienteDni === filtro))
  const consulta = filtro ? `?dni=${encodeURIComponent(filtro)}` : ''
  return api.get<PedidoPickup[]>(`/api/v1/retail/control/pickup-pendientes${consulta}`)
}

/** RF-31: campañas del canal RETAIL vigentes ahora mismo. */
export function listarCampanasVigentes(): Promise<CampanaVigente[]> {
  if (USA_MOCKS) return simular(() => CAMPANAS_EJEMPLO)
  return api.get<CampanaVigente[]>('/api/v1/retail/control/campanas-vigentes')
}

/**
 * RF-31: una campaña vencida o que aún no empieza no se muestra, aunque llegue en la respuesta
 * (por ejemplo, de la caché de 15 minutos del backend justo cuando vence).
 */
export const esVigente = (campana: CampanaVigente, ahora = new Date()) => {
  const desde = Date.parse(campana.vigenteDesde)
  const hasta = Date.parse(campana.vigenteHasta)
  const instante = ahora.getTime()
  return (Number.isNaN(desde) || desde <= instante) && (Number.isNaN(hasta) || instante <= hasta)
}

// ---------------------------------------------------------------------------
// Ejemplos del contrato §5.11 para VITE_USE_MOCKS=true
// ---------------------------------------------------------------------------

const simular = <T,>(datos: () => T) => new Promise<T>((resolver) => setTimeout(() => resolver(datos()), 250))

const haceHoras = (horas: number) => new Date(Date.now() - horas * 3_600_000).toISOString()
const enDias = (dias: number) => new Date(Date.now() + dias * 86_400_000).toISOString()

const STOCK_CRITICO_EJEMPLO: VarianteCritica[] = [
  {
    sku: 'ZAP-RUN-42', productoId: 'PROD-101', nombreProducto: 'Zapatilla Running Pro', talla: '42', color: 'Negro',
    nivel: 'AGOTADO', stockTienda: 0, disponibleEnCentral: true, stockCentral: 45,
  },
  {
    sku: 'CAM-FUT-L-ROJ', productoId: 'PROD-204', nombreProducto: 'Camiseta Fútbol Clásica', talla: 'L', color: 'Rojo',
    nivel: 'AGOTADO', stockTienda: null, disponibleEnCentral: false, stockCentral: null,
  },
  {
    sku: 'ZAPVEL-41-AZU', productoId: 'PROD-102', nombreProducto: 'Zapatillas Velocity X', talla: '41', color: 'Azul',
    nivel: 'CRITICO', stockTienda: 2, disponibleEnCentral: true, stockCentral: 12,
  },
  {
    sku: 'TOPPRO-M-NEG', productoId: 'PROD-305', nombreProducto: 'Top de compresión Pro', talla: 'M', color: 'Negro',
    nivel: 'CRITICO', stockTienda: null, disponibleEnCentral: null, stockCentral: null,
  },
]

const PICKUPS_EJEMPLO: PedidoPickup[] = [
  {
    pedidoId: 'PED-2026-00431', clienteNombre: 'María González', clienteDni: '45678912', anaquelUbicacion: 'Anaquel A-12',
    fechaArriboTienda: haceHoras(1), estado: 'LISTO_PARA_RECOJO',
    articulos: [{ sku: 'TOPPRO-M-NEG', nombre: 'Top de compresión Pro', talla: 'M', color: 'Negro', cantidad: 1 }],
  },
  {
    pedidoId: 'PED-2026-00427', clienteNombre: 'Juan Pérez Torres', clienteDni: '72345678', anaquelUbicacion: 'Anaquel B-04',
    fechaArriboTienda: haceHoras(3), estado: 'LISTO_PARA_RECOJO',
    articulos: [
      { sku: 'ZAPVEL-41-AZU', nombre: 'Zapatillas Velocity X', talla: '41', color: 'Azul', cantidad: 1 },
      { sku: 'MED-RUN-U-BLA', nombre: 'Medias Running', talla: 'Única', color: 'Blanco', cantidad: 2 },
    ],
  },
  {
    pedidoId: 'PED-2026-00419', clienteNombre: 'Rosa Quispe Huamán', clienteDni: null, anaquelUbicacion: 'Anaquel C-01',
    fechaArriboTienda: haceHoras(5), estado: 'LISTO_PARA_RECOJO',
    articulos: [{ sku: 'BOL-GYM-U-NEG', nombre: 'Bolso Gym', talla: 'Única', color: 'Negro', cantidad: 1 }],
  },
]

const CAMPANAS_EJEMPLO: CampanaVigente[] = [
  {
    campanaId: 'CMP-2026-011', titulo: '30% en chimpunes', descripcion: 'Con cupón en mostrador', tipoDescuento: 'PORCENTAJE',
    valor: 30, codigoCupon: 'GOAL2026', montoMinimo: 150, condiciones: 'No acumulable con otras promociones',
    vigenteDesde: haceHoras(24 * 6), vigenteHasta: enDias(4),
  },
  {
    campanaId: 'CMP-2026-014', titulo: '2x1 en medias', descripcion: 'Llévate dos pares y paga uno', tipoDescuento: 'NXM',
    valor: null, codigoCupon: null, montoMinimo: null, condiciones: 'Se aplica al par de menor precio',
    vigenteDesde: haceHoras(48), vigenteHasta: enDias(10),
  },
  {
    campanaId: 'CMP-2026-015', titulo: 'Verano en movimiento', descripcion: '10% en toda la tienda', tipoDescuento: 'PORCENTAJE',
    valor: 10, codigoCupon: 'VERANO2026', montoMinimo: null, condiciones: null,
    vigenteDesde: haceHoras(24), vigenteHasta: enDias(30),
  },
]

function resumenSimulado(): ResumenControl {
  return {
    pickupPendientes: PICKUPS_EJEMPLO.length,
    stockCritico: STOCK_CRITICO_EJEMPLO.length,
    campanasVigentes: CAMPANAS_EJEMPLO.length,
    fuentesNoDisponibles: [],
    actualizadoEn: new Date().toISOString(),
  }
}
