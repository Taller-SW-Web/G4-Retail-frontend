import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./http', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./http')>()),
  USA_MOCKS: false,
  api: { get: vi.fn().mockResolvedValue({ items: [], page: 0, size: 20, total: 0 }) },
}))

import { api } from './http'
import { buscarPedidos, consultaPedidos, obtenerPedido } from './pedidoApi'

afterEach(() => vi.mocked(api.get).mockClear())

describe('pedidoApi (F6 · RF-16)', () => {
  it('arma la consulta con un solo filtro y la paginación del contrato', () => {
    expect(consultaPedidos({ documentoCliente: ' 72345678 ' })).toBe('documentoCliente=72345678&page=0&size=20')
    expect(consultaPedidos({ codigoPedido: 'PED-2026-00412' }, 1, 10)).toBe('codigoPedido=PED-2026-00412&page=1&size=10')
  })

  it('busca por DNI en GET /api/v1/retail/pedidos', async () => {
    await buscarPedidos({ documentoCliente: '72345678' })
    expect(api.get).toHaveBeenCalledWith('/api/v1/retail/pedidos?documentoCliente=72345678&page=0&size=20')
  })

  it('pide el detalle en GET /api/v1/retail/pedidos/{pedidoId} con el id codificado', async () => {
    await obtenerPedido('PED 2026/1')
    expect(api.get).toHaveBeenCalledWith('/api/v1/retail/pedidos/PED%202026%2F1')
  })
})
