import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import type { VentaOfflineRegistro } from '../types/contingencia'
import type { Product } from '../types'

/**
 * CA-10-02 / CA-10-03 en el navegador real: las ventas de contingencia y el catálogo
 * se guardan en IndexedDB (no en memoria), para que sobrevivan a una recarga del POS.
 */
function venta(uuid: string, fecha: string, estado: VentaOfflineRegistro['estado'] = 'PENDIENTE'): VentaOfflineRegistro {
  return {
    ventaLocalUuid: uuid,
    terminalPos: 'POS-01',
    turnoId: 'turno-01',
    correlativoContingencia: `CONT-${uuid}`,
    fechaHoraOffline: fecha,
    items: [{ sku: 'SKU-1', cantidad: 1, precioUnitario: 50 }],
    totalNeto: 50,
    efectivoRecibido: 50,
    vuelto: 0,
    clienteId: null,
    hashIntegridad: `hash-${uuid}`,
    estado,
  }
}

const producto = (id: string): Product => ({ id, name: `Prenda ${id}` }) as unknown as Product

async function cargarModulo() {
  vi.resetModules()
  return import('./offlineStorage')
}

describe('offlineStorage con IndexedDB — RF-27 / CA-10-02 y CA-10-03', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { indexedDB: new IDBFactory() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('persiste las ventas offline y devuelve solo las pendientes en orden FIFO', async () => {
    const storage = await cargarModulo()
    await storage.guardarVentaOffline(venta('b', '2026-11-07T06:05:00Z'))
    await storage.guardarVentaOffline(venta('a', '2026-11-07T06:00:00Z'))
    await storage.guardarVentaOffline(venta('c', '2026-11-07T05:00:00Z', 'RESINCRONIZADO'))

    // Un módulo recién cargado lee lo guardado: la cola no vive en memoria.
    const otraPestana = await cargarModulo()
    const pendientes = await otraPestana.obtenerVentasPendientes()

    expect(pendientes.map((v) => v.ventaLocalUuid)).toEqual(['a', 'b'])
    expect(await otraPestana.contarVentasPendientes()).toBe(2)
  })

  it('marca una venta como sincronizada con su pedido y comprobante', async () => {
    const storage = await cargarModulo()
    await storage.guardarVentaOffline(venta('a', '2026-11-07T06:00:00Z'))

    await storage.actualizarEstadoVentaOffline('a', 'RESINCRONIZADO', 'PED-1', 'B010-00001', null)

    expect(await storage.contarVentasPendientes()).toBe(0)
  })

  it('ignora la actualización de una venta que no existe', async () => {
    const storage = await cargarModulo()
    await storage.actualizarEstadoVentaOffline('no-existe', 'RESINCRONIZADO')
    expect(await storage.obtenerVentasPendientes()).toEqual([])
  })

  it('reemplaza el catálogo local con la última copia y lo recupera sin conexión', async () => {
    const storage = await cargarModulo()
    expect(await storage.obtenerCatalogoCache()).toBeNull()

    await storage.guardarCatalogoCache([producto('1'), producto('2')])
    await storage.guardarCatalogoCache([producto('3')])

    const catalogo = await storage.obtenerCatalogoCache()
    expect(catalogo?.map((p) => p.id)).toEqual(['3'])
  })
})
