// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEffect } from 'react'
import { ContingenciaProvider, useContingencia } from './ContingenciaContext'
import { _resetFallbackStorage, guardarVentaOffline, obtenerVentasPendientes } from '../lib/offlineStorage'
import * as apiContingencia from '../api/contingencia'
import * as hookConexion from '../hooks/useEstadoConexion'
import type { VentaOfflineRegistro } from '../types/contingencia'

vi.mock('../api/contingencia')
vi.mock('../hooks/useEstadoConexion')

const mockSincronizarLote = vi.mocked(apiContingencia.sincronizarLoteContingencia)
const mockUseEstadoConexion = vi.mocked(hookConexion.useEstadoConexion)

function TestConsumer({ onMount }: { onMount?: (ctx: ReturnType<typeof useContingencia>) => void }) {
  const ctx = useContingencia()
  useEffect(() => {
    if (onMount) onMount(ctx)
  }, [ctx, onMount])

  return (
    <div>
      <span data-testid="enLinea">{ctx.enLinea ? 'ONLINE' : 'OFFLINE'}</span>
      <span data-testid="pendientes">{ctx.pendientesCount}</span>
      <span data-testid="sincronizando">{ctx.sincronizando ? 'SI' : 'NO'}</span>
      <span data-testid="progreso">{ctx.progreso || ''}</span>
      <span data-testid="mensajeExito">{ctx.mensajeExito || ''}</span>
      <span data-testid="errorSync">{ctx.errorSync || ''}</span>
      <button onClick={() => ctx.sincronizarCola()}>Sincronizar</button>
    </div>
  )
}

function crearVentaEjemplo(id: string, terminal = 'POS-01', turno = 'TURNO-01'): VentaOfflineRegistro {
  return {
    ventaLocalUuid: id,
    terminalPos: terminal,
    turnoId: turno,
    correlativoContingencia: `CONT-${id.slice(0, 5)}`,
    fechaHoraOffline: new Date().toISOString(),
    items: [{ sku: 'SKU-001', cantidad: 1, precioUnitario: 100 }],
    totalNeto: 100,
    efectivoRecibido: 100,
    vuelto: 0,
    clienteId: null,
    hashIntegridad: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    estado: 'PENDIENTE',
  }
}

describe('ContingenciaContext (RF-26, RF-27, RF-28)', () => {
  beforeEach(() => {
    _resetFallbackStorage()
    vi.clearAllMocks()
    mockUseEstadoConexion.mockReturnValue(true)
  })

  afterEach(() => {
    cleanup()
    _resetFallbackStorage()
  })

  it('inicializa con cero pendientes y detecta ventas offline registradas (CA-10-02)', async () => {
    let capturedCtx: ReturnType<typeof useContingencia> | null = null

    await act(async () => {
      render(
        <ContingenciaProvider>
          <TestConsumer onMount={(c) => { capturedCtx = c }} />
        </ContingenciaProvider>
      )
    })

    expect(screen.getByTestId('pendientes').textContent).toBe('0')

    const venta = crearVentaEjemplo('uuid-test-1')
    await act(async () => {
      await capturedCtx!.registrarVentaOffline(venta)
    })

    expect(screen.getByTestId('pendientes').textContent).toBe('1')
  })

  it('sincroniza en cola FIFO al llamar sincronizarCola y actualiza estado a RESINCRONIZADO (RF-28 / CA-10-01)', async () => {
    const v1 = crearVentaEjemplo('uuid-1')
    const v2 = crearVentaEjemplo('uuid-2')
    await guardarVentaOffline(v1)
    await guardarVentaOffline(v2)

    mockSincronizarLote.mockResolvedValueOnce({
      totalProcesados: 2,
      resultados: [
        { ventaLocalUuid: 'uuid-1', estado: 'RESINCRONIZADO', pedidoId: 'PED-001', comprobante: 'B010-00001' },
        { ventaLocalUuid: 'uuid-2', estado: 'RESINCRONIZADO', pedidoId: 'PED-002', comprobante: 'B010-00002' },
      ],
    })

    let capturedCtx: ReturnType<typeof useContingencia> | null = null

    await act(async () => {
      render(
        <ContingenciaProvider>
          <TestConsumer onMount={(c) => { capturedCtx = c }} />
        </ContingenciaProvider>
      )
    })

    expect(screen.getByTestId('pendientes').textContent).toBe('2')

    await act(async () => {
      await capturedCtx!.sincronizarCola()
    })

    expect(mockSincronizarLote).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('pendientes').textContent).toBe('0')
    expect(screen.getByTestId('mensajeExito').textContent).toContain('Sincronización completada')

    const pendientesFinales = await obtenerVentasPendientes()
    expect(pendientesFinales.length).toBe(0)
  })

  it('separa lotes por turno y terminal respetando paquetes de hasta 50 ventas (CA-10-05)', async () => {
    const v1 = crearVentaEjemplo('uuid-pos1-t1', 'POS-01', 'TURNO-01')
    const v2 = crearVentaEjemplo('uuid-pos2-t2', 'POS-02', 'TURNO-02')
    await guardarVentaOffline(v1)
    await guardarVentaOffline(v2)

    mockSincronizarLote.mockImplementation(async (req) => ({
      totalProcesados: req.lote.length,
      resultados: req.lote.map((item) => ({
        ventaLocalUuid: item.ventaLocalUuid,
        estado: 'RESINCRONIZADO',
        pedidoId: `PED-${item.ventaLocalUuid}`,
        comprobante: `B010-${item.ventaLocalUuid}`,
      })),
    }))

    let capturedCtx: ReturnType<typeof useContingencia> | null = null

    await act(async () => {
      render(
        <ContingenciaProvider>
          <TestConsumer onMount={(c) => { capturedCtx = c }} />
        </ContingenciaProvider>
      )
    })

    await act(async () => {
      await capturedCtx!.sincronizarCola()
    })

    // Debió enviar 2 peticiones separadas por terminal/turno
    expect(mockSincronizarLote).toHaveBeenCalledTimes(2)
    expect(screen.getByTestId('pendientes').textContent).toBe('0')
  })

  it('maneja errores de red conservando las ventas pendientes para posterior reintento', async () => {
    const v1 = crearVentaEjemplo('uuid-fallo')
    await guardarVentaOffline(v1)

    mockSincronizarLote.mockRejectedValueOnce(new Error('Servidor no disponible'))

    let capturedCtx: ReturnType<typeof useContingencia> | null = null

    await act(async () => {
      render(
        <ContingenciaProvider>
          <TestConsumer onMount={(c) => { capturedCtx = c }} />
        </ContingenciaProvider>
      )
    })

    await act(async () => {
      await capturedCtx!.sincronizarCola()
    })

    expect(screen.getByTestId('errorSync').textContent).toContain('Servidor no disponible')
    expect(screen.getByTestId('pendientes').textContent).toBe('1')

    const pendientes = await obtenerVentasPendientes()
    expect(pendientes.length).toBe(1)
  })
})
