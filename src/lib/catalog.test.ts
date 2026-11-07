import { describe, expect, it } from 'vitest'
import { filterProducts, lineasVendibles, productoDeVariante, searchProducts } from './catalog'
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

describe('búsqueda por etiqueta (RF-04)', () => {
  const withVariants: Product[] = [
    {
      ...catalog[1],
      variants: [
        { sku: 'ZAPVEL-38-NEG', barcode: '7751001000012', size: '38', color: 'Negro', stock: 4 },
      ],
    },
  ]

  it('encuentra el artículo por el SKU de una de sus variantes', () => {
    expect(searchProducts(withVariants, 'ZAPVEL-38-NEG')).toEqual(withVariants)
  })

  it('encuentra el artículo por el código de barras que dispara el lector', () => {
    expect(searchProducts(withVariants, '7751001000012')).toEqual(withVariants)
  })
})

describe('productoDeVariante (RF-05: se vende la talla y el color elegidos)', () => {
  const zapatilla: Product = {
    id: 'PROD-101',
    name: 'Zapatillas Velocity X',
    category: 'Running',
    price: 249,
    stock: 7,
    image: '',
    variants: [
      { sku: 'ZAPVEL-38-NEG', barcode: '', size: '38', color: 'Negro', stock: 4 },
      { sku: 'ZAPVEL-40-AZU', barcode: '', size: '40', color: 'Azul', stock: 3 },
    ],
  }

  it('crea una línea de carrito con el SKU, el stock y la talla de la variante elegida', () => {
    const linea = productoDeVariante(zapatilla, zapatilla.variants![1])

    expect(linea).toMatchObject({ id: 'ZAPVEL-40-AZU', name: 'Zapatillas Velocity X', price: 249, stock: 3 })
    expect(linea.variants).toEqual([zapatilla.variants![1]])
  })

  it('dos tallas del mismo artículo son líneas distintas del carrito', () => {
    const [a, b] = zapatilla.variants!.map((v) => productoDeVariante(zapatilla, v))
    expect(a.id).not.toBe(b.id)
  })

  it('las líneas guardadas del carrito se pueden recuperar con el catálogo expandido', () => {
    const ids = lineasVendibles([zapatilla]).map((p) => p.id)
    expect(ids).toEqual(['PROD-101', 'ZAPVEL-38-NEG', 'ZAPVEL-40-AZU'])
  })
})
