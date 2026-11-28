// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/http'
import type { CalculoCarrito } from '../api/carritoApi'
import type { CartItem } from '../types'
import { useTotalesCarrito } from './useTotalesCarrito'

// Devuelve la respuesta o el error que lanzaría el backend (se lanza en el envoltorio, no en el espía).
const calcularCarrito = vi.fn<(peticion: unknown, precios?: unknown) => CalculoCarrito | Error>()
vi.mock('../api/carritoApi', async (original) => ({
  ...(await original<typeof import('../api/carritoApi')>()),
  calcularCarrito: async (peticion: unknown, precios?: unknown) => {
    const resultado = calcularCarrito(peticion, precios)
    if (resultado instanceof Error) throw resultado
    return resultado
  },
}))

const items: CartItem[] = [{
  product: {
    id: 'CAM-RUN', name: 'Camiseta Running', category: 'Ropa', price: 129.9, stock: 5, image: '',
    variants: [{ sku: 'CAM-RUN-M-AZUL', barcode: '', size: 'M', color: 'Azul', stock: 5 }],
  },
  quantity: 2,
}]

function respuesta(parcial: Partial<CalculoCarrito> = {}): CalculoCarrito {
  return {
    lineas: [{ sku: 'CAM-RUN-M-AZUL', cantidad: 2, precioUnitario: 129.9, descuento: 25.98, precioFinal: 233.82,
      promocionAplicada: '10% Cupón VERANO2026' }],
    subtotalBruto: 259.8, descuentoTotal: 25.98, totalPagar: 233.82, baseImponible: 198.15, montoIgv: 35.67,
    moneda: 'PEN', evaluacionId: 'EVAL-1', advertencias: [],
    ...parcial,
  }
}

beforeEach(() => calcularCarrito.mockReset())
afterEach(() => vi.useRealTimers())

describe('useTotalesCarrito — totales calculados por Retail (RF-11, RF-12, §5.4)', () => {
  it('pide el cálculo solo con SKU, cantidad y cupón: el precio lo pone el backend', async () => {
    calcularCarrito.mockReturnValue(respuesta())
    renderHook(() => useTotalesCarrito(items, 'VERANO2026'))

    await waitFor(() => expect(calcularCarrito).toHaveBeenCalledTimes(1))
    expect(calcularCarrito.mock.calls[0][0]).toEqual({
      items: [{ sku: 'CAM-RUN-M-AZUL', cantidad: 2 }],
      cupon: 'VERANO2026',
    })
  })

  it('cupón válido: usa el descuento, la promoción y la evaluación que devuelve el backend', async () => {
    calcularCarrito.mockReturnValue(respuesta())
    const { result } = renderHook(() => useTotalesCarrito(items, 'VERANO2026'))

    await waitFor(() => expect(result.current.estimado).toBe(false))
    expect(result.current.totales).toEqual({
      subtotalBruto: 259.8, descuentoTotal: 25.98, totalPagar: 233.82, baseImponible: 198.15, montoIgv: 35.67,
    })
    expect(result.current.promociones).toEqual(['10% Cupón VERANO2026'])
    expect(result.current.evaluacionId).toBe('EVAL-1')
    expect(result.current.cuponInvalido).toBe(false)
  })

  it('cupón falso o vencido: avisa sin bloquear y mantiene los precios normales', async () => {
    calcularCarrito.mockReturnValue(respuesta({
      lineas: [{ sku: 'CAM-RUN-M-AZUL', cantidad: 2, precioUnitario: 129.9, descuento: 0, precioFinal: 259.8 }],
      descuentoTotal: 0, totalPagar: 259.8, baseImponible: 220.17, montoIgv: 39.63, advertencias: ['CUPON_INVALIDO'],
    }))
    const { result } = renderHook(() => useTotalesCarrito(items, 'FALSO'))

    await waitFor(() => expect(result.current.cuponInvalido).toBe(true))
    expect(result.current.totales.totalPagar).toBe(259.8)
    expect(result.current.bloqueoCuarentena).toBeNull()
  })

  it('una prenda en cuarentena (422 SKU_EN_CUARENTENA) bloquea el cobro con el mensaje del backend', async () => {
    const errorCuarentena = new ApiError(422, {
      code: 'SKU_EN_CUARENTENA', detail: 'PRODUCTO BLOQUEADO POR CUARENTENA: CAM-RUN-M-AZUL',
    })
    calcularCarrito.mockReturnValue(errorCuarentena)
    const { result } = renderHook(() => useTotalesCarrito(items, ''))

    await waitFor(() => expect(result.current.bloqueoCuarentena).toBe('PRODUCTO BLOQUEADO POR CUARENTENA: CAM-RUN-M-AZUL'))
  })

  it('sin conexión muestra el total estimado sin descuentos', async () => {
    calcularCarrito.mockReturnValue(new ApiError(0, { code: 'SIN_CONEXION' }))
    const { result } = renderHook(() => useTotalesCarrito(items, 'VERANO2026'))

    await waitFor(() => expect(result.current.calculando).toBe(false))
    expect(result.current.estimado).toBe(true)
    expect(result.current.totales.descuentoTotal).toBe(0)
    expect(result.current.totales.totalPagar).toBe(259.8)
  })

  it('remover el cupón vuelve a calcular y restablece los precios', async () => {
    calcularCarrito.mockReturnValueOnce(respuesta())
    const { result, rerender } = renderHook(({ cupon }) => useTotalesCarrito(items, cupon), {
      initialProps: { cupon: 'VERANO2026' },
    })
    await waitFor(() => expect(result.current.totales.descuentoTotal).toBe(25.98))

    calcularCarrito.mockReturnValueOnce(respuesta({ lineas: [], descuentoTotal: 0, totalPagar: 259.8 }))
    act(() => rerender({ cupon: '' }))

    await waitFor(() => expect(result.current.totales.descuentoTotal).toBe(0))
    expect(calcularCarrito.mock.calls[1][0]).toEqual({ items: [{ sku: 'CAM-RUN-M-AZUL', cantidad: 2 }], cupon: undefined })
  })

  it('con el carrito vacío no llama al backend', async () => {
    const { result } = renderHook(() => useTotalesCarrito([], 'VERANO2026'))
    await new Promise((r) => setTimeout(r, 400))
    expect(calcularCarrito).not.toHaveBeenCalled()
    expect(result.current.totales.totalPagar).toBe(0)
  })
})
