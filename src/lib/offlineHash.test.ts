import { describe, expect, it } from 'vitest'
import { calcularHashContingencia } from './offlineHash'

describe('offlineHash — CA-10-06 y RF-27', () => {
  it('calcula el hash SHA-256 de forma determinista para la venta offline', async () => {
    const params = {
      terminalPos: 'POS-01',
      turnoId: 'cccccccc-0000-0000-0001-000000000001',
      ventaLocalUuid: '11111111-2222-3333-4444-555555555555',
      correlativoContingencia: 'CONT-POS01-00001',
      fechaHoraOffline: '2026-11-07T06:00:00Z',
      items: [{ sku: 'SKU-PRUEBA', cantidad: 1, precioUnitario: 10.0 }],
      totalNeto: 10.0,
      efectivoRecibido: 20.0,
      vuelto: 10.0,
      clienteId: null,
    }

    const hash1 = await calcularHashContingencia(params)
    const hash2 = await calcularHashContingencia(params)

    expect(hash1).toHaveLength(64)
    expect(hash1).toMatch(/^[a-f0-9]{64}$/)
    expect(hash1).toBe(hash2)
  })

  it('alterar cualquier campo (SKU, cantidad, importes) cambia el hash resultante', async () => {
    const base = {
      terminalPos: 'POS-01',
      turnoId: 'cccccccc-0000-0000-0001-000000000001',
      ventaLocalUuid: '11111111-2222-3333-4444-555555555555',
      correlativoContingencia: 'CONT-POS01-00001',
      fechaHoraOffline: '2026-11-07T06:00:00Z',
      items: [{ sku: 'SKU-PRUEBA', cantidad: 1, precioUnitario: 10.0 }],
      totalNeto: 10.0,
      efectivoRecibido: 20.0,
      vuelto: 10.0,
      clienteId: null,
    }

    const hashBase = await calcularHashContingencia(base)

    const hashAlterado = await calcularHashContingencia({
      ...base,
      items: [{ sku: 'SKU-PRUEBA', cantidad: 2, precioUnitario: 10.0 }],
      totalNeto: 20.0,
      vuelto: 0.0,
    })

    expect(hashBase).not.toBe(hashAlterado)
  })
})
