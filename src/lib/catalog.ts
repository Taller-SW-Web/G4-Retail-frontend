import type { Product } from '../types'

function normalizeSearchTerm(value: string): string {
  return value.trim().toLocaleLowerCase('es-PE').normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export function searchProducts(products: Product[], query: string): Product[] {
  const term = normalizeSearchTerm(query)
  if (!term) return products

  return products.filter((product) =>
    [product.name, product.category, product.id].some((value) =>
      normalizeSearchTerm(value).includes(term),
    ),
  )
}
