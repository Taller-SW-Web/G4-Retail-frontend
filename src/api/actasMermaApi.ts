/**
 * Acta de discrepancia o merma de tienda (F12 · RF-34).
 *
 * Rutas del contrato (`api-contracts.md` §5.12): `GET /retail/inventario/cuarentena` y
 * `POST /retail/inventario/actas-merma`. Con `VITE_USE_MOCKS=true` responde con prendas de ejemplo;
 * con `false` se llama al backend real.
 */
import { api, ApiError, USA_MOCKS } from './http'

export type TipoFalla = 'MANCHADO_PROBADOR' | 'COSTURA_ROTA' | 'EXTRAVIO_NO_UBICADO' | 'DEFECTO_FABRICA'

export type EstadoIncidencia = 'EN_CUARENTENA' | 'DERIVADO_ALMACEN' | 'BAJA_DEFINITIVA' | 'PENDIENTE_REPORTE'

export type TipoDestino = 'DEVOLUCION_CENTRAL' | 'BAJA_DEFINITIVA' | 'AJUSTE_PERDIDA'

/** Prenda retenida en la tienda, tal como la devuelve la bandeja de cuarentena. */
export interface IncidenciaCuarentena {
  incidenciaId: string
  sku: string
  nombreProducto: string
  tipoFalla: TipoFalla
  fechaReporte: string
  estado: EstadoIncidencia
}

export interface EmisionActa {
  incidenciasIds: string[]
  tipoDestino: TipoDestino
  observaciones?: string
}

export interface ActaEmitida {
  actaNumero: string
  totalPrendas: number
  incidencias: { incidenciaId: string; estado: EstadoIncidencia }[]
  /** El contrato lo incluye, pero el acta se imprime desde el POS: puede no llegar. */
  urlPdf?: string | null
  /** Propuesto al PO para la impresión del acta. Si no llega, se usa la hora en que se emitió. */
  fechaEmision?: string
}

/** RF-33: prendas en cuarentena de la tienda del perfil. */
export function listarCuarentena(): Promise<IncidenciaCuarentena[]> {
  if (USA_MOCKS) return Promise.resolve(cuarentenaSimulada.filter((p) => p.estado === 'EN_CUARENTENA'))
  return api.get<IncidenciaCuarentena[]>('/api/v1/retail/inventario/cuarentena')
}

/** RF-34: emite el acta y pasa las prendas a `DERIVADO_ALMACEN`. Solo SUPERVISOR. */
export function emitirActa(emision: EmisionActa): Promise<ActaEmitida> {
  if (USA_MOCKS) return emitirActaSimulada(emision)
  return api.post<ActaEmitida>('/api/v1/retail/inventario/actas-merma', emision)
}

// ── Modo simulado ────────────────────────────────────────────────────────────────────────────────

const cuarentenaSimulada: IncidenciaCuarentena[] = [
  {
    incidenciaId: 'inc-0001',
    sku: 'POLTEC-M-BLA',
    nombreProducto: 'Polo técnico DryFit M blanco',
    tipoFalla: 'MANCHADO_PROBADOR',
    fechaReporte: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    estado: 'EN_CUARENTENA',
  },
  {
    incidenciaId: 'inc-0002',
    sku: 'ZAPVEL-38-NEG',
    nombreProducto: 'Zapatilla Velocity 38 negro',
    tipoFalla: 'COSTURA_ROTA',
    fechaReporte: new Date(Date.now() - 86_400_000).toISOString(),
    estado: 'EN_CUARENTENA',
  },
  {
    incidenciaId: 'inc-0003',
    sku: 'CASAT-L-AZU',
    nombreProducto: 'Casaca atlética L azul',
    tipoFalla: 'EXTRAVIO_NO_UBICADO',
    fechaReporte: new Date().toISOString(),
    estado: 'EN_CUARENTENA',
  },
]

let correlativoSimulado = 0

async function emitirActaSimulada({ incidenciasIds }: EmisionActa): Promise<ActaEmitida> {
  if (incidenciasIds.length === 0) {
    throw new ApiError(400, { code: 'LISTA_VACIA', detail: 'Selecciona al menos una prenda' })
  }
  const prendas = incidenciasIds.map((id) => cuarentenaSimulada.find((p) => p.incidenciaId === id))
  if (prendas.some((p) => !p || p.estado !== 'EN_CUARENTENA')) {
    throw new ApiError(409, {
      code: 'INCIDENCIA_NO_EN_CUARENTENA',
      detail: 'Una de las prendas ya no está en cuarentena',
    })
  }
  prendas.forEach((p) => (p!.estado = 'DERIVADO_ALMACEN'))
  correlativoSimulado += 1
  const fecha = new Date()
  return {
    actaNumero: `ACTA-MERMA-${fecha.getFullYear()}-${String(correlativoSimulado).padStart(4, '0')}`,
    totalPrendas: prendas.length,
    incidencias: incidenciasIds.map((incidenciaId) => ({ incidenciaId, estado: 'DERIVADO_ALMACEN' })),
    fechaEmision: fecha.toISOString(),
  }
}
