import { describe, expect, it } from 'vitest'
import { resolveScan, sampleBarcodes } from './scanner'
import type { Product } from '../types'

const catalog: Product[] = [
  {
    id: 'sku-1001',
    name: 'Zapatillas Velocity X',
    category: 'Running',
    price: 249,
    stock: 7,
    image: '',
    variants: [
      { sku: 'ZAPVEL-38-NEG', barcode: '7751001000012', size: '38', color: 'Negro', stock: 4 },
      { sku: 'ZAPVEL-40-AZU', barcode: '7751001000036', size: '40', color: 'Azul', stock: 3 },
    ],
  },
  {
    id: 'sku-1003',
    name: 'Mancuernas 12kg',
    category: 'Gym',
    price: 139,
    stock: 5,
    image: '',
  },
]

describe('resolveScan', () => {
  it('resuelve la variante exacta a partir del código de barras', () => {
    expect(resolveScan(catalog, '7751001000036')).toEqual({
      product: catalog[0],
      variant: catalog[0].variants![1],
    })
  })

  it('acepta también el SKU tecleado, sin importar mayúsculas', () => {
    expect(resolveScan(catalog, 'zapvel-38-neg')?.variant?.size).toBe('38')
  })

  it('cae al artículo cuando no tiene variantes que etiquetar', () => {
    expect(resolveScan(catalog, 'sku-1003')).toEqual({ product: catalog[1] })
  })

  it('no elige nada ante una etiqueta ajena al catálogo', () => {
    expect(resolveScan(catalog, '7759999999999')).toBeNull()
    expect(resolveScan(catalog, '   ')).toBeNull()
  })
})

describe('sampleBarcodes', () => {
  it('propone solo artículos con etiqueta, con su talla para reconocerlos', () => {
    expect(sampleBarcodes(catalog)).toEqual([
      { code: '7751001000012', label: 'Zapatillas Velocity X · 38' },
    ])
  })
})
