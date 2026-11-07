import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./http', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./http')>()),
  USA_MOCKS: true,
}))

import { ApiError } from './http'
import { buscarPedidos, obtenerPedido } from './pedidoApi'

/** Resuelve la promesa adelantando la latencia simulada del modo VITE_USE_MOCKS. */
async function resolver<T>(promesa: Promise<T>): Promise<T> {
  const resultado = promesa.then(
    (valor) => ({ valor }),
    (error: unknown) => ({ error }),
  )
  await vi.runAllTimersAsync()
  const r = await resultado
  if ('error' in r) throw r.error
  return r.valor
}

describe('pedidoApi en modo simulado (F6 · RF-16, RF-17)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('busca por DNI y devuelve los pedidos del más reciente al más antiguo', async () => {
    const pagina = await resolver(buscarPedidos({ documentoCliente: ' 72345678 ' }))

    expect(pagina.total).toBeGreaterThan(1)
    const fechas = pagina.items.map((p) => Date.parse(p.fechaCreacion))
    expect(fechas).toEqual([...fechas].sort((a, b) => b - a))
  })

  it('pagina los resultados con page y size', async () => {
    const pagina = await resolver(buscarPedidos({ documentoCliente: '72345678' }, 1, 1))

    expect(pagina.page).toBe(1)
    expect(pagina.size).toBe(1)
    expect(pagina.items).toHaveLength(1)
  })

  it('busca por código de pedido', async () => {
    const pagina = await resolver(buscarPedidos({ codigoPedido: 'PED-2026-00398' }))
    expect(pagina.items.map((p) => p.pedidoId)).toEqual(['PED-2026-00398'])
  })

  it('responde 404 PEDIDO_NO_ENCONTRADO si ningún pedido coincide', async () => {
    const error = await resolver(buscarPedidos({ codigoPedido: 'PED-0000-00000' })).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(404)
  })

  it('devuelve el detalle con su historial de estados en orden cronológico', async () => {
    const pedido = await resolver(obtenerPedido(' PED-2026-00377 '))

    expect(pedido.historialEstados.map((e) => e.estado)).toEqual(['CREADO', 'PAGADO', 'ANULADO'])
    expect(pedido.historialEstados.at(-1)?.motivo).toBeTruthy()
  })

  it('responde 404 al pedir el detalle de un pedido inexistente', async () => {
    const error = await resolver(obtenerPedido('PED-0000-00000')).catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(404)
  })
})
