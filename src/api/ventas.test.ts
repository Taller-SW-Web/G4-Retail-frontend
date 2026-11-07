import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api } from './http'
import { registrarVentaConReintento, type VentaRequest } from './ventas'

afterEach(() => vi.restoreAllMocks())

const peticion: VentaRequest = {
  terminalPos: 'POS-01',
  turnoId: 'bbbbbbbb-0000-0000-0000-000000000002',
  items: [{ sku: 'POLTEC-M-BLA', cantidad: 1 }],
  pago: { medioPago: 'EFECTIVO', montoRecibidoEfectivo: 59.9 },
  comprobante: { tipo: 'BOLETA' },
  emitirTicketRegalo: false,
}
const confirmada = { pedidoId: 'PED-2026-00412' }
const sinEspera = () => Promise.resolve()

/**
 * F5 · RF-14 y contrato §5.4: si Ventas no confirma a tiempo, Retail responde
 * 503 VENTAS_NO_DISPONIBLE y pide repetir la misma operación con la misma clave.
 */
describe('registrarVentaConReintento', () => {
  it('reintenta una vez con la misma Idempotency-Key cuando Ventas no confirma a tiempo', async () => {
    const post = vi.spyOn(api, 'post')
      .mockRejectedValueOnce(new ApiError(503, { code: 'VENTAS_NO_DISPONIBLE' }))
      .mockResolvedValueOnce(confirmada)

    await expect(registrarVentaConReintento(peticion, 'clave-1', sinEspera)).resolves.toBe(confirmada)

    expect(post).toHaveBeenCalledTimes(2)
    expect(post.mock.calls[0]).toEqual(['/api/v1/retail/ventas', peticion, { 'Idempotency-Key': 'clave-1' }])
    expect(post.mock.calls[1]).toEqual(post.mock.calls[0])
  })

  it('si el reintento tampoco se confirma, devuelve el error para que el cajero decida', async () => {
    const post = vi.spyOn(api, 'post').mockRejectedValue(new ApiError(503, { code: 'VENTAS_NO_DISPONIBLE' }))

    await expect(registrarVentaConReintento(peticion, 'clave-1', sinEspera)).rejects.toMatchObject({ status: 503 })
    expect(post).toHaveBeenCalledTimes(2)
  })

  it('no reintenta un rechazo de negocio', async () => {
    const post = vi.spyOn(api, 'post').mockRejectedValue(new ApiError(409, { code: 'IDEMPOTENCY_CONFLICT' }))

    await expect(registrarVentaConReintento(peticion, 'clave-1', sinEspera)).rejects.toMatchObject({ status: 409 })
    expect(post).toHaveBeenCalledTimes(1)
  })
})
