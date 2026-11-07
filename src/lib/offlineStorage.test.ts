import { beforeEach, describe, expect, it } from 'vitest'
import {
  actualizarEstadoVentaOffline,
  contarVentasPendientes,
  guardarCatalogoCache,
  guardarVentaOffline,
  obtenerCatalogoCache,
  obtenerVentasPendientes,
  _resetFallbackStorage,
} from './offlineStorage'
import type { VentaOfflineRegistro } from '../types/contingencia'
import type { Product } from '../types'

describe('offlineStorage — CA-10-02 y CA-10-03', () => {
  beforeEach(() => {
    _resetFallbackStorage()
  })

  it('guarda una venta offline y la recupera en cola FIFO de pendientes', async () => {
    const venta1: VentaOfflineRegistro = {
      ventaLocalUuid: 'uuid-1',
      terminalPos: 'POS-01',
      turnoId: 'turno-01',
      correlativoContingencia: 'CONT-POS01-00001',
      fechaHoraOffline: '2026-11-07T06:00:00Z',
      items: [{ sku: 'SKU-1', cantidad: 1, precioUnitario: 50.0 }],
      totalNeto: 50.0,
      efectivoRecibido: 100.0,
      vuelto: 50.0,
      clienteId: null,
      hashIntegridad: 'hash1',
      estado: 'PENDIENTE',
    }

    const venta2: VentaOfflineRegistro = {
      ventaLocalUuid: 'uuid-2',
      terminalPos: 'POS-01',
      turnoId: 'turno-01',
      correlativoContingencia: 'CONT-POS01-00002',
      fechaHoraOffline: '2026-11-07T06:05:00Z',
      items: [{ sku: 'SKU-2', cantidad: 2, precioUnitario: 30.0 }],
      totalNeto: 60.0,
      efectivoRecibido: 60.0,
      vuelto: 0.0,
      clienteId: null,
      hashIntegridad: 'hash2',
      estado: 'PENDIENTE',
    }

    await guardarVentaOffline(venta2)
    await guardarVentaOffline(venta1)

    const pendientes = await obtenerVentasPendientes()
    expect(pendientes).toHaveLength(2)
    // Orden FIFO por fecha (venta1 es anterior a venta2)
    expect(pendientes[0].ventaLocalUuid).toBe('uuid-1')
    expect(pendientes[1].ventaLocalUuid).toBe('uuid-2')
  })

  it('actualiza el estado de conciliación de una venta sincronizada', async () => {
    const venta: VentaOfflineRegistro = {
      ventaLocalUuid: 'uuid-1',
      terminalPos: 'POS-01',
      turnoId: 'turno-01',
      correlativoContingencia: 'CONT-POS01-00001',
      fechaHoraOffline: '2026-11-07T06:00:00Z',
      items: [{ sku: 'SKU-1', cantidad: 1, precioUnitario: 50.0 }],
      totalNeto: 50.0,
      efectivoRecibido: 50.0,
      vuelto: 0.0,
      clienteId: null,
      hashIntegridad: 'hash1',
      estado: 'PENDIENTE',
    }

    await guardarVentaOffline(venta)
    expect(await contarVentasPendientes()).toBe(1)

    await actualizarEstadoVentaOffline('uuid-1', 'RESINCRONIZADO', 'PED-1234', 'B010-00001')
    expect(await contarVentasPendientes()).toBe(0)
  })

  it('guarda y recupera el catálogo local para contingencia (CA-10-03)', async () => {
    const productos: Product[] = [
      {
        id: 'p1',
        name: 'Polo Deportivo',
        price: 50.0,
        category: 'Polos',
        image: '/img.jpg',
        stock: 10,
        variants: [
          {
            sku: 'POLO-M-NEG',
            barcode: '7751234567890',
            size: 'M',
            color: 'Negro',
            stock: 10,
          },
        ],
      },
    ]

    await guardarCatalogoCache(productos)
    const recuperado = await obtenerCatalogoCache()
    expect(recuperado).toEqual(productos)
  })
})
