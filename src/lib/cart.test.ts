import { describe, expect, it } from 'vitest'
import { addProductToCart, getCartItemCount, getCartSubtotal, setCartItemQuantity } from './cart'
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
})
