/**
 * Mock del turno de caja (F8).
 *
 * Reproduce el comportamiento del backend real —incluidos sus errores— para poder desarrollar y
 * demostrar el flujo completo sin levantar nada: un solo turno por terminal (409), egreso que no
 * puede superar el efectivo en gaveta (422), turno inexistente (404) y arqueo ciego que solo revela
 * el saldo del sistema al cerrar.
 *
 * El turno se guarda en `localStorage` para que sobreviva a un F5 durante la demo, igual que hacía
 * el prototipo. Se apaga con `VITE_USE_MOCKS=false`.
 */
import { ApiError } from '../http'
import type {
  MovimientoTurnoRequest,
  MovimientoTurnoResponse,
  ReporteZResponse,
  TurnoCajaResponse,
} from '../caja'

const CLAVE = 'retail.caja.turno'
const DEMORA_MS = 250

interface MovimientoGuardado {
  id: string
  tipoMovimiento: MovimientoTurnoRequest['tipoMovimiento']
  monto: number
  motivo: string
  autorizadoPor: string
}

interface TurnoGuardado {
  turnoId: string
  terminalPos: string
  saldoInicial: number
  fechaHoraApertura: string
  movimientos: MovimientoGuardado[]
}

const redondear = (monto: number) => Math.round(monto * 100) / 100

const esperar = () => new Promise((resolver) => setTimeout(resolver, DEMORA_MS))

function leerTurno(): TurnoGuardado | null {
  try {
    const crudo = window.localStorage.getItem(CLAVE)
    return crudo ? (JSON.parse(crudo) as TurnoGuardado) : null
  } catch {
    return null
  }
}

function guardarTurno(turno: TurnoGuardado | null): void {
  try {
    if (turno) window.localStorage.setItem(CLAVE, JSON.stringify(turno))
    else window.localStorage.removeItem(CLAVE)
  } catch {
    // Modo privado: el mock sigue funcionando en memoria durante la sesión de la pestaña.
  }
}

const sumaPorTipo = (turno: TurnoGuardado, tipo: MovimientoTurnoRequest['tipoMovimiento']) =>
  redondear(turno.movimientos.filter((m) => m.tipoMovimiento === tipo).reduce((total, m) => total + m.monto, 0))

/** Efectivo esperado en gaveta: fondo fijo + ingresos menores - egresos menores. */
const saldoEnGaveta = (turno: TurnoGuardado) =>
  redondear(turno.saldoInicial + sumaPorTipo(turno, 'INGRESO_MENOR') - sumaPorTipo(turno, 'SALIDA_GASTO'))

/**
 * Turno que la base devolvería como el más reciente de la tienda.
 *
 * Como el backend, no filtra por terminal: la ruta `/turnos/actual` no recibe parámetros y la tienda
 * tiene (en este alcance) una sola caja. Sin turno abierto responde `CERRADA`, no un 404.
 */
export async function turnoActualSimulado(): Promise<TurnoCajaResponse> {
  await esperar()
  const turno = leerTurno()

  if (!turno) return { estado: 'CERRADA' }

  return {
    estado: 'ABIERTA',
    turnoId: turno.turnoId,
    terminalPos: turno.terminalPos,
    fechaHoraApertura: turno.fechaHoraApertura,
    saldoInicialEfectivo: turno.saldoInicial,
  }
}

export async function abrirTurnoSimulado(saldoInicialEfectivo: number, terminalPos: string): Promise<TurnoCajaResponse> {
  await esperar()

  const abierto = leerTurno()
  if (abierto) {
    throw new ApiError(409, {
      code: 'CAJA_YA_ABIERTA',
      title: 'Conflicto con el estado actual',
      detail: `La terminal ${abierto.terminalPos} ya cuenta con un turno abierto. Debe cerrarlo antes de iniciar uno nuevo`,
    })
  }

  const turno: TurnoGuardado = {
    turnoId: `tur-${Date.now()}`,
    terminalPos,
    saldoInicial: redondear(saldoInicialEfectivo),
    fechaHoraApertura: new Date().toISOString(),
    movimientos: [],
  }
  guardarTurno(turno)

  return {
    estado: 'ABIERTA',
    turnoId: turno.turnoId,
    terminalPos: turno.terminalPos,
    fechaHoraApertura: turno.fechaHoraApertura,
    saldoInicialEfectivo: turno.saldoInicial,
  }
}

/** Busca el turno que pide la ruta y falla igual que el backend si no existe o no es el vigente. */
function turnoDeLaRuta(turnoId: string): TurnoGuardado {
  const turno = leerTurno()
  if (!turno) {
    throw new ApiError(404, {
      code: 'TURNO_NO_ENCONTRADO',
      title: 'Recurso no encontrado',
      detail: 'El turno de caja indicado no existe',
    })
  }
  if (turno.turnoId !== turnoId) {
    throw new ApiError(404, {
      code: 'TURNO_NO_ENCONTRADO',
      title: 'Recurso no encontrado',
      detail: 'El turno de caja indicado no existe',
    })
  }
  return turno
}

export async function registrarMovimientoSimulado(
  turnoId: string,
  movimiento: MovimientoTurnoRequest,
): Promise<MovimientoTurnoResponse> {
  await esperar()
  const turno = turnoDeLaRuta(turnoId)

  const monto = redondear(movimiento.monto)
  if (movimiento.tipoMovimiento === 'SALIDA_GASTO' && monto > saldoEnGaveta(turno)) {
    throw new ApiError(422, {
      code: 'FONDOS_INSUFICIENTES_EN_GAVETA',
      title: 'Regla de negocio no cumplida',
      detail: `El efectivo en gaveta no alcanza para el egreso: disponible S/ ${saldoEnGaveta(turno).toFixed(2)}`,
    })
  }

  const guardado: MovimientoGuardado = {
    id: `mov-${turno.movimientos.length + 1}`,
    tipoMovimiento: movimiento.tipoMovimiento,
    monto,
    motivo: movimiento.motivo,
    autorizadoPor: movimiento.autorizadoPor,
  }
  turno.movimientos.push(guardado)
  guardarTurno(turno)

  return { movimientoId: guardado.id, nuevoSaldoEstimado: saldoEnGaveta(turno) }
}

export async function cerrarTurnoSimulado(
  turnoId: string,
  montoDeclarado: number,
  observaciones: string,
): Promise<ReporteZResponse> {
  await esperar()
  const turno = turnoDeLaRuta(turnoId)

  // Sin cobros de venta todavía (F5): el sistema se compone del fondo y los movimientos menores.
  const ingresosMenores = sumaPorTipo(turno, 'INGRESO_MENOR')
  const egresosMenores = sumaPorTipo(turno, 'SALIDA_GASTO')
  const saldoSistema = redondear(turno.saldoInicial + ingresosMenores - egresosMenores)
  const declarado = redondear(montoDeclarado)
  const diferencia = redondear(declarado - saldoSistema)

  guardarTurno(null)
  void observaciones

  return {
    turnoId: turno.turnoId,
    saldoInicial: turno.saldoInicial,
    ventasEfectivoTotal: 0,
    ingresosMenores,
    egresosMenores,
    saldoSistema,
    saldoDeclarado: declarado,
    diferencia,
    estado: diferencia === 0 ? 'CERRADA' : 'OBSERVADA',
  }
}
