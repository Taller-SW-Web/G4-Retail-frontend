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

/** Prenda incluida en el acta, con lo necesario para imprimirla. */
export interface PrendaActa {
  incidenciaId: string
  sku: string
  tipoFalla: TipoFalla
  detalleObservacion: string
  estado: EstadoIncidencia
}

/** Respuesta 201 del contrato v0.5.4: trae todo lo que se imprime. Retail no genera PDF. */
export interface ActaEmitida {
  actaNumero: string
  fechaEmision: string
  tiendaId: string
  tipoDestino: TipoDestino
  observaciones: string | null
  supervisor: { id: string; nombre: string }
  totalPrendas: number
  incidencias: PrendaActa[]
}

/**
 * Solo entran al acta las prendas que Inventario ya aceptó (`EN_CUARENTENA`). Las que siguen en
 * `PENDIENTE_REPORTE` también bloquean la venta, pero todavía no existen en Inventario.
 */
export const puedeEntrarAlActa = (prenda: IncidenciaCuarentena) => prenda.estado === 'EN_CUARENTENA'

/** Estado que toma cada prenda según el destino del acta (decisión del PO, 26/11). */
export const estadoSegunDestino = (destino: TipoDestino): EstadoIncidencia =>
  destino === 'DEVOLUCION_CENTRAL' ? 'DERIVADO_ALMACEN' : 'BAJA_DEFINITIVA'

/** RF-33: prendas en cuarentena activa (`EN_CUARENTENA` y `PENDIENTE_REPORTE`) de la tienda del perfil. */
export function listarCuarentena(): Promise<IncidenciaCuarentena[]> {
  if (USA_MOCKS)
    return Promise.resolve(
      cuarentenaSimulada.filter((p) => p.estado === 'EN_CUARENTENA' || p.estado === 'PENDIENTE_REPORTE'),
    )
  return api.get<IncidenciaCuarentena[]>('/api/v1/retail/inventario/cuarentena')
}

/** RF-34: emite el acta y saca las prendas de la cuarentena según el destino. Solo SUPERVISOR. */
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
  {
    incidenciaId: 'inc-0004',
    sku: 'SHORUN-S-NEG',
    nombreProducto: 'Short running S negro',
    tipoFalla: 'DEFECTO_FABRICA',
    fechaReporte: new Date().toISOString(),
    estado: 'PENDIENTE_REPORTE',
  },
]

const detalleSimulado: Record<string, string> = {
  'inc-0001': 'Mancha de maquillaje en el cuello',
  'inc-0002': 'Costura abierta en el talón',
  'inc-0003': 'No aparece en el almacén de la tienda',
  'inc-0004': 'Cierre defectuoso',
}

let correlativoSimulado = 0

async function emitirActaSimulada({ incidenciasIds, tipoDestino, observaciones }: EmisionActa): Promise<ActaEmitida> {
  if (incidenciasIds.length === 0) {
    throw new ApiError(400, { code: 'LISTA_VACIA', detail: 'Selecciona al menos una prenda' })
  }
  const prendas = incidenciasIds.map((id) => cuarentenaSimulada.find((p) => p.incidenciaId === id))
  if (prendas.some((p) => !p || !puedeEntrarAlActa(p))) {
    throw new ApiError(409, {
      code: 'INCIDENCIA_NO_EN_CUARENTENA',
      detail: 'Una de las prendas ya no está en cuarentena',
    })
  }
  const estado = estadoSegunDestino(tipoDestino)
  prendas.forEach((p) => (p!.estado = estado))
  correlativoSimulado += 1
  const fecha = new Date()
  return {
    actaNumero: `ACTA-MERMA-${fecha.getFullYear()}-${String(correlativoSimulado).padStart(4, '0')}`,
    fechaEmision: fecha.toISOString(),
    tiendaId: 'TIENDA-MIRAFLORES',
    tipoDestino,
    observaciones: observaciones ?? null,
    supervisor: { id: 'bbbbbbbb-0000-0000-0000-000000000002', nombre: 'Supervisor de demo' },
    totalPrendas: prendas.length,
    incidencias: prendas.map((p) => ({
      incidenciaId: p!.incidenciaId,
      sku: p!.sku,
      tipoFalla: p!.tipoFalla,
      detalleObservacion: detalleSimulado[p!.incidenciaId] ?? '',
      estado,
    })),
  }
}
