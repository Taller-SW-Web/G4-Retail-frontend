// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { listarCuarentena, type ItemCuarentena } from '../api/inventarioApi'
import { useCuarentena } from './useCuarentena'

vi.mock('../api/inventarioApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/inventarioApi')>()),
  listarCuarentena: vi.fn(),
}))

const item = (sku: string): ItemCuarentena => ({
  incidenciaId: `inc-${sku}`,
  sku,
  nombreProducto: null,
  tipoFalla: 'COSTURA_ROTA',
  fechaReporte: '2026-11-26T15:30:00Z',
  estado: 'EN_CUARENTENA',
})

afterEach(() => {
  cleanup()
  vi.mocked(listarCuarentena).mockReset()
})

describe('useCuarentena (F12 · RF-33)', () => {
  it('carga la bandeja y expone los SKU bloqueados', async () => {
    vi.mocked(listarCuarentena).mockResolvedValue([item('A'), item('B')])

    const { result } = renderHook(() => useCuarentena())

    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(result.current.items).toHaveLength(2)
    expect([...result.current.skus]).toEqual(['A', 'B'])
    expect(result.current.error).toBeNull()
  })

  it('recargar trae la prenda recién reportada', async () => {
    vi.mocked(listarCuarentena).mockResolvedValueOnce([]).mockResolvedValueOnce([item('NUEVA')])
    const { result } = renderHook(() => useCuarentena())
    await waitFor(() => expect(result.current.cargando).toBe(false))

    await act(() => result.current.recargar())

    expect(result.current.skus.has('NUEVA')).toBe(true)
  })

  it('si la consulta falla, queda vacía con el error y el POS sigue funcionando', async () => {
    vi.mocked(listarCuarentena).mockRejectedValue(new Error('Servicio no disponible'))

    const { result } = renderHook(() => useCuarentena())

    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(result.current.error).toBe('Servicio no disponible')
    expect(result.current.skus.size).toBe(0)
  })

  it('un error que no es Error se informa con un mensaje genérico', async () => {
    vi.mocked(listarCuarentena).mockRejectedValue('caída')

    const { result } = renderHook(() => useCuarentena())

    await waitFor(() => expect(result.current.error).toBe('No se pudo consultar la cuarentena'))
  })
})
