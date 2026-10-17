import { describe, expect, it } from 'vitest'
import { addProductToCart, calcularTotales, getCartItemCount, getCartSubtotal, setCartItemQuantity } from './cart'
import type { CartItem, Product } from '../types'

const product: Product = {
  id: 'sku-1',
  name: 'Zapatillas',
  category: 'Running',
  price: 100,
  stock: 2,
  image: '/shoe.jpg',
}

describe('cart helpers', () => {
  it('adds products and calculates totals', () => {
    const cart = addProductToCart([], product)

    expect(cart).toEqual([{ product, quantity: 1 }])
    expect(getCartItemCount(cart)).toBe(1)
    expect(getCartSubtotal(cart)).toBe(100)
  })

  it('does not add a product beyond available stock', () => {
    const atMaximum: CartItem[] = [{ product, quantity: 2 }]

    expect(addProductToCart(atMaximum, product)).toBe(atMaximum)
    expect(setCartItemQuantity(atMaximum, product.id, 4)[0]?.quantity).toBe(2)
  })

  it('removes a line when its quantity reaches zero', () => {
    expect(setCartItemQuantity([{ product, quantity: 1 }], product.id, 0)).toEqual([])
  })

  it('calculates SUNAT tax breakdown correctly (RF-12)', () => {
    const items: CartItem[] = [{ product, quantity: 1 }] // price: 100
    const totales = calcularTotales(items)

    expect(totales.subtotalBruto).toBe(100)
    expect(totales.descuentoTotal).toBe(0)
    expect(totales.totalPagar).toBe(100)
    expect(totales.baseImponible).toBe(84.75)
    expect(totales.montoIgv).toBe(15.25)
    expect(totales.baseImponible + totales.montoIgv).toBe(100)
  })

  it('applies VERANO2026 coupon with 10% discount', () => {
    const items: CartItem[] = [{ product, quantity: 2 }] // price: 200
    const totales = calcularTotales(items, 'VERANO2026')

    expect(totales.subtotalBruto).toBe(200)
    expect(totales.descuentoTotal).toBe(20)
    expect(totales.totalPagar).toBe(180)
    expect(totales.baseImponible).toBe(152.54)
    expect(totales.montoIgv).toBe(27.46)
    expect(totales.baseImponible + totales.montoIgv).toBe(180)
  })
})
