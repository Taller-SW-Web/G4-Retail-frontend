import { afterEach, describe, expect, it, vi } from 'vitest'
import { products } from '../data/products'
import { aplicarCuarentena, estaEnCuarentena, sonarError } from './cuarentena'

afterEach(() => vi.unstubAllGlobals())

describe('cuarentena en el catálogo (F12 · RF-33)', () => {
  it('sin prendas en cuarentena devuelve el mismo catálogo', () => {
    expect(aplicarCuarentena(products, new Set())).toBe(products)
  })

  it('bloquea un artículo sin tallas por su id y deja intactos los que no están reportados', () => {
    const resultado = aplicarCuarentena(products, new Set(['sku-1003']))
    const mancuernas = resultado.find((p) => p.id === 'sku-1003')!

    expect(mancuernas.enCuarentena).toBe(true)
    expect(mancuernas.stock).toBe(0)
    expect(estaEnCuarentena(mancuernas)).toBe(true)
    expect(resultado.find((p) => p.id === 'sku-1002')).toBe(products.find((p) => p.id === 'sku-1002'))
  })
})

describe('sonarError', () => {
  it('emite un pitido corto cuando el navegador tiene audio', () => {
    const oscilador = { type: '', frequency: { value: 0 }, connect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null as null | (() => void) }
    const close = vi.fn().mockResolvedValue(undefined)
    const AudioContext = vi.fn(function () {
      return { createOscillator: () => oscilador, destination: {}, currentTime: 1, close }
    })
    vi.stubGlobal('window', { AudioContext })

    sonarError()

    expect(oscilador.start).toHaveBeenCalled()
    expect(oscilador.stop).toHaveBeenCalledWith(1.25)
    oscilador.onended?.()
    expect(close).toHaveBeenCalled()
  })

  it('sin audio disponible no hace nada ni lanza error', () => {
    vi.stubGlobal('window', {})
    expect(() => sonarError()).not.toThrow()
  })

  it('si el audio falla al crearse, el mostrador sigue sin error', () => {
    vi.stubGlobal('window', {
      AudioContext: vi.fn(function () {
        throw new Error('autoplay bloqueado')
      }),
    })
    expect(() => sonarError()).not.toThrow()
  })
})
