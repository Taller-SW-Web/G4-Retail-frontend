// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { Product } from '../types'

vi.mock('../api/catalogoApi', () => ({ listarCatalogo: vi.fn() }))
vi.mock('../lib/offlineStorage', () => ({
  guardarCatalogoCache: vi.fn().mockResolvedValue(undefined),
  obtenerCatalogoCache: vi.fn(),
}))

import { listarCatalogo } from '../api/catalogoApi'
import { guardarCatalogoCache, obtenerCatalogoCache } from '../lib/offlineStorage'
import { useCartStore } from '../store/cart'
import { useCatalogoTienda } from './useCatalogoTienda'

const polo: Product = {
  id: 'PROD-104',
  name: 'Polo técnico DryFit',
  category: 'Ropa',
  price: 59.9,
  stock: 4,
  image: '',
  variants: [{ sku: 'POLTEC-M-BLA', barcode: '', size: 'M', color: 'Blanco', stock: 4 }],
}

beforeEach(() => {
  window.localStorage.clear()
  useCartStore.getState().vaciarCarrito()
})

afterEach(() => vi.clearAllMocks())

describe('useCatalogoTienda (F2 · RF-04, F10 · CA-10-03)', () => {
  it('no consulta el catálogo mientras no hay sesión', () => {
    const { result } = renderHook(() => useCatalogoTienda(false))

    expect(result.current).toEqual([])
    expect(listarCatalogo).not.toHaveBeenCalled()
  })

  it('con sesión carga el catálogo de Retail y guarda la copia para contingencia', async () => {
    vi.mocked(listarCatalogo).mockResolvedValue([polo])

    const { result } = renderHook(() => useCatalogoTienda(true))

    await waitFor(() => expect(result.current).toEqual([polo]))
    expect(guardarCatalogoCache).toHaveBeenCalledWith([polo])
  })

  it('sin conexión con Retail usa la última copia local del catálogo', async () => {
    vi.mocked(listarCatalogo).mockRejectedValue(new Error('sin red'))
    vi.mocked(obtenerCatalogoCache).mockResolvedValue([polo])

    const { result } = renderHook(() => useCatalogoTienda(true))

    await waitFor(() => expect(result.current).toEqual([polo]))
  })

  it('sin conexión ni copia local deja el catálogo vacío', async () => {
    vi.mocked(listarCatalogo).mockRejectedValue(new Error('sin red'))
    vi.mocked(obtenerCatalogoCache).mockResolvedValue(null)

    const { result } = renderHook(() => useCatalogoTienda(true))

    await waitFor(() => expect(obtenerCatalogoCache).toHaveBeenCalled())
    expect(result.current).toEqual([])
  })

  it('recupera el carrito guardado con la variante exacta que se había elegido', async () => {
    window.localStorage.setItem('inka-retail-cart', JSON.stringify([{ productId: 'POLTEC-M-BLA', quantity: 2 }]))
    vi.mocked(listarCatalogo).mockResolvedValue([polo])

    renderHook(() => useCatalogoTienda(true))

    await waitFor(() => expect(useCartStore.getState().items).toHaveLength(1))
    const [linea] = useCartStore.getState().items
    expect(linea.product.id).toBe('POLTEC-M-BLA')
    expect(linea.quantity).toBe(2)
  })

  it('no reemplaza un carrito que ya está en curso', async () => {
    window.localStorage.setItem('inka-retail-cart', JSON.stringify([{ productId: 'POLTEC-M-BLA', quantity: 2 }]))
    useCartStore.getState().cargarCarrito([{ product: { ...polo, id: 'OTRO', variants: undefined }, quantity: 1 }])
    vi.mocked(listarCatalogo).mockResolvedValue([polo])

    const { result } = renderHook(() => useCatalogoTienda(true))

    await waitFor(() => expect(result.current).toEqual([polo]))
    expect(useCartStore.getState().items.map((i) => i.product.id)).toEqual(['OTRO'])
  })
})
