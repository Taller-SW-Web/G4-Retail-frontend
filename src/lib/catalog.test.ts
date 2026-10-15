import { describe, expect, it } from 'vitest'
import { filterProducts, searchProducts } from './catalog'
import type { Product } from '../types'

const catalog: Product[] = [
  { id: 'sku-1001', name: 'Balón de fútbol', category: 'Fútbol', price: 119, stock: 4, image: '' },
  { id: 'sku-1002', name: 'Zapatillas Velocity', category: 'Running', price: 249, stock: 2, image: '' },
]

describe('searchProducts', () => {
  it('matches product name, category, and SKU without case sensitivity', () => {
    expect(searchProducts(catalog, 'velocity')).toEqual([catalog[1]])
    expect(searchProducts(catalog, 'SKU-1001')).toEqual([catalog[0]])
  })

  it('matches accented text when the query omits accents', () => {
    expect(searchProducts(catalog, 'futbol')).toEqual([catalog[0]])
  })

  it('returns the complete catalog for an empty query', () => {
    expect(searchProducts(catalog, '  ')).toBe(catalog)
  })

  it('combines category and text filters', () => {
    expect(filterProducts(catalog, '', 'Fútbol')).toEqual([catalog[0]])
    expect(filterProducts(catalog, 'sku-1001', 'Running')).toEqual([])
    expect(filterProducts(catalog, '', 'Todas')).toEqual(catalog)
  })
})
