import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./http', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./http')>()),
  USA_MOCKS: false,
  api: { get: vi.fn().mockResolvedValue([]), post: vi.fn().mockResolvedValue({}) },
}))

import { api } from './http'
import { confirmarEntrega, esCodigoRetiroValido, listarPickups, totalPrendas } from './pickupApi'

afterEach(() => vi.clearAllMocks())

describe('pickupApi contra el backend (F7 · RF-18, RF-19, contrato §5.7)', () => {
  it('RF-18: lista la bandeja en GET /api/v1/retail/pickup/pendientes', async () => {
    await listarPickups()
    expect(api.get).toHaveBeenCalledWith('/api/v1/retail/pickup/pendientes')
  })

  it('RF-19: registra la entrega en POST /retail/pickup/{pedidoId}/entrega con el id codificado', async () => {
    const entrega = { dniRecoge: '45678912', nombreRecoge: 'María González', esTerceroAutorizado: false }

    await confirmarEntrega('PED 2026/1', entrega)

    expect(api.post).toHaveBeenCalledWith('/api/v1/retail/pickup/PED%202026%2F1/entrega', entrega)
  })

  it('valida el código de retiro de 6 caracteres alfanuméricos en mayúsculas', () => {
    expect(esCodigoRetiroValido('A7K2Q9')).toBe(true)
    expect(esCodigoRetiroValido('a7k2q9')).toBe(false)
    expect(esCodigoRetiroValido('A7K2Q')).toBe(false)
  })

  it('suma las prendas del bulto', () => {
    const prenda = { sku: 'X', nombre: 'X', talla: 'M', color: 'Negro' }
    expect(totalPrendas([{ ...prenda, cantidad: 2 }, { ...prenda, cantidad: 1 }])).toBe(3)
  })
})
