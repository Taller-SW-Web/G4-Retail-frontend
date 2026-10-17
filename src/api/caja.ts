/**
 * Control de turno y cuadre de caja (F8 · RF-20, RF-21, RF-22).
 *
 * Un solo archivo por dominio, como `api/seguridad.ts`: aquí viven los cuatro endpoints de caja y
 * los tipos que comparten la tienda y la pantalla de cierre. Con `VITE_USE_MOCKS=true` responde el
 * mock local (`api/mock/caja.ts`); con `false` se llama al backend real.
 *
 * Las rutas son las que fija el documento de reparto de la Semana 8:
 * `POST /caja/turnos`, `GET /caja/turnos/actual`, `POST /caja/turnos/{turnoId}/movimientos` y
 * `POST /caja/turnos/{turnoId}/cierre`. El turno viaja como subrecurso, de modo que un movimiento o
 * un cierre siempre van atados al turno que el cajero tiene delante.
 */
import { api, USA_MOCKS } from './http'
import {
  abrirTurnoSimulado,
  cerrarTurnoSimulado,
  registrarMovimientoSimulado,
  turnoActualSimulado,
} from './mock/caja'

/** Terminal de esta instalación. No viaja como dato de negocio: es configuración del POS. */
export const TERMINAL_POS: string = import.meta.env.VITE_TERMINAL_POS ?? 'POS-01'

export type TipoMovimientoCaja = 'INGRESO_MENOR' | 'SALIDA_GASTO'

/**
 * Turno de caja vigente; espeja `TurnoCajaResponse` del backend.
 *
 * Sin turno abierto llega `estado: 'CERRADA'` y el resto de campos no viajan (el backend usa
 * `default-property-inclusion=non_null`), así que la SPA distingue "no hay turno" de "error" sin
 * mirar el código HTTP.
 */
export interface TurnoCajaResponse {
  estado: 'ABIERTA' | 'CERRADA'
  turnoId?: string
  terminalPos?: string
  cajero?: string
  fechaHoraApertura?: string
  saldoInicialEfectivo?: number
}

/** Cuerpo de `POST /caja/turnos` (RF-20); espeja `AperturaTurnoRequest`. */
export interface AperturaTurnoRequest {
  terminalPos: string
  saldoInicialEfectivo: number
}

/** Cuerpo de `POST /caja/turnos/{turnoId}/cierre` (RF-22); espeja `CierreTurnoRequest`. */
export interface CierreTurnoRequest {
  montoDeclarado: number
  observaciones: string
}

/** Cuerpo de `POST /caja/turnos/{turnoId}/movimientos` (RF-21); espeja `MovimientoTurnoRequest`. */
export interface MovimientoTurnoRequest {
  tipoMovimiento: TipoMovimientoCaja
  monto: number
  motivo: string
  /** Nombre o código de quien autoriza; el backend lo guarda como texto. */
  autorizadoPor: string
}

/** Respuesta de `POST /caja/turnos/{turnoId}/movimientos` (RF-21). */
export interface MovimientoTurnoResponse {
  movimientoId: string
  nuevoSaldoEstimado: number
}

/**
 * Resultado del arqueo ciego (RF-22); espeja `ReporteZResponse` del backend.
 *
 * `diferencia` negativa es **faltante** y positiva es **sobrante**; ambas dejan el turno en
 * `OBSERVADA`.
 */
export interface ReporteZResponse {
  turnoId: string
  saldoInicial: number
  ventasEfectivoTotal: number
  ingresosMenores: number
  egresosMenores: number
  saldoSistema: number
  saldoDeclarado: number
  diferencia: number
  estado: 'CERRADA' | 'OBSERVADA'
}

/** Turno vigente de la tienda, o `estado: 'CERRADA'` si no hay ninguno abierto. */
export function turnoActual(): Promise<TurnoCajaResponse> {
  if (USA_MOCKS) return turnoActualSimulado()

  return api.get<TurnoCajaResponse>('/api/v1/retail/caja/turnos/actual')
}

/** Abre el turno con fondo fijo. El backend responde 409 si la terminal ya tiene uno abierto. */
export function abrirTurno(
  saldoInicialEfectivo: number,
  terminalPos: string = TERMINAL_POS,
): Promise<TurnoCajaResponse> {
  if (USA_MOCKS) return abrirTurnoSimulado(saldoInicialEfectivo, terminalPos)

  return api.post<TurnoCajaResponse>('/api/v1/retail/caja/turnos', {
    terminalPos,
    saldoInicialEfectivo,
  } satisfies AperturaTurnoRequest)
}

/** Registra un ingreso o egreso menor del turno. Responde 422 si el egreso no cabe en gaveta. */
export function registrarMovimiento(
  turnoId: string,
  movimiento: MovimientoTurnoRequest,
): Promise<MovimientoTurnoResponse> {
  if (USA_MOCKS) return registrarMovimientoSimulado(turnoId, movimiento)

  return api.post<MovimientoTurnoResponse>(`/api/v1/retail/caja/turnos/${turnoId}/movimientos`, movimiento)
}

/** Cierra el turno con arqueo ciego y devuelve el Reporte Z. */
export function cerrarTurno(
  turnoId: string,
  montoDeclarado: number,
  observaciones: string,
): Promise<ReporteZResponse> {
  if (USA_MOCKS) return cerrarTurnoSimulado(turnoId, montoDeclarado, observaciones)

  return api.post<ReporteZResponse>(`/api/v1/retail/caja/turnos/${turnoId}/cierre`, {
    montoDeclarado,
    observaciones,
  } satisfies CierreTurnoRequest)
}
