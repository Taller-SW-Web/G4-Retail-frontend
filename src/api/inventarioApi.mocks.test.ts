import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ACEPTACION_SIMULADA_MS, listarCuarentena, reiniciarSimulacion, reportarIncidencia } from './inventarioApi'

const datos = {
  sku: 'ZAPVEL-38-NEG',
  tipoFalla: 'COSTURA_ROTA' as const,
  detalleObservacion: 'Costura abierta en el talón',
}

beforeEach(() => {
  vi.useFakeTimers()
  reiniciarSimulacion()
})

afterEach(() => vi.useRealTimers())

const esperar = async <T,>(promesa: Promise<T>) => {
  await vi.advanceTimersByTimeAsync(300)
  return promesa
}

describe('inventarioApi con mocks (F12 · §5.12)', () => {
  it('el reporte nace PENDIENTE_REPORTE y aparece en la bandeja con el nombre de la prenda', async () => {
    const registrada = await esperar(reportarIncidencia(datos, 'clave-1'))
    const bandeja = await esperar(listarCuarentena())

    expect(registrada.estado).toBe('PENDIENTE_REPORTE')
    expect(bandeja).toHaveLength(1)
    expect(bandeja[0]).toMatchObject({ sku: 'ZAPVEL-38-NEG', nombreProducto: 'Zapatillas Velocity X (38 / Negro)' })
  })

  it('pasa a EN_CUARENTENA cuando Inventory acepta el reporte', async () => {
    await esperar(reportarIncidencia(datos, 'clave-1'))
    await vi.advanceTimersByTimeAsync(ACEPTACION_SIMULADA_MS)

    const [item] = await esperar(listarCuarentena())
    expect(item.estado).toBe('EN_CUARENTENA')
  })

  it('🔁 la misma clave devuelve la misma incidencia; con otro cuerpo responde IDEMPOTENCY_CONFLICT', async () => {
    const primera = await esperar(reportarIncidencia(datos, 'clave-1'))
    const repetida = await esperar(reportarIncidencia(datos, 'clave-1'))

    expect(repetida.incidenciaId).toBe(primera.incidenciaId)
    expect(await esperar(listarCuarentena())).toHaveLength(1)

    const conflicto = reportarIncidencia({ ...datos, sku: 'OTRO' }, 'clave-1').catch((e: unknown) => e)
    await vi.advanceTimersByTimeAsync(300)
    expect(await conflicto).toMatchObject({ status: 409, codigo: 'IDEMPOTENCY_CONFLICT' })
  })
})
