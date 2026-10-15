import { describe, expect, it } from 'vitest'
import { loadCart, saveCart } from './cartStorage'
import type { Product } from '../types'

const product: Product = {
  id: 'sku-1',
  name: 'Zapatillas',
  category: 'Running',
  price: 100,
  stock: 2,
  image: '/shoe.jpg',
}

function createStorage(initialValue: string | null = null) {
  let value = initialValue
  return {
    getItem: () => value,
    setItem: (_key: string, nextValue: string) => { value = nextValue },
  }
}

describe('cart persistence', () => {
  it('restores known products and caps quantities at current stock', () => {
    const storage = createStorage('[{"productId":"sku-1","quantity":5}]')

    expect(loadCart([product], storage)).toEqual([{ product, quantity: 2 }])
  })

  it('ignores unknown products and invalid quantities', () => {
    const storage = createStorage(
      '[{"productId":"unknown","quantity":1},{"productId":"sku-1","quantity":0}]',
    )

    expect(loadCart([product], storage)).toEqual([])
  })

  it('stores only product IDs and quantities', () => {
    const storage = createStorage()
    saveCart([{ product, quantity: 1 }], storage)

    expect(storage.getItem('inka-retail-cart')).toBe('[{"productId":"sku-1","quantity":1}]')
  })
})
