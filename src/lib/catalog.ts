import type { Product, Variant } from '../types'

function normalizeSearchTerm(value: string): string {
  return value.trim().toLocaleLowerCase('es-PE').normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

/** Todo lo que identifica a un artículo y por lo que el vendedor puede preguntarlo o escanearlo. */
function searchableValues(product: Product): string[] {
  const variantCodes = (product.variants ?? []).flatMap((variant) => [variant.sku, variant.barcode])
  return [product.name, product.category, product.id, ...variantCodes]
}

/**
 * Búsqueda multicriterio del catálogo (RF-04).
 *
 * Además del nombre y la categoría busca por SKU y por código de barras, porque el lector láser
 * escribe el código en esta misma caja: para el buscador, escanear es solo teclear muy rápido.
 */
export function searchProducts(products: Product[], query: string): Product[] {
  const term = normalizeSearchTerm(query)
  if (!term) return products

  return products.filter((product) =>
    searchableValues(product).some((value) => normalizeSearchTerm(value).includes(term)),
  )
}

export function filterProducts(
  products: Product[],
  query: string,
  category: string,
): Product[] {
  return searchProducts(products, query).filter(
    (product) => category === 'Todas' || product.category === category,
  )
}

/**
 * Línea vendible de una variante (RF-05): la talla y el color elegidos entran al carrito con su
 * propio SKU y stock, para que la venta descuente exactamente esa prenda y no la primera variante.
 */
export function productoDeVariante(product: Product, variant: Variant): Product {
  return { ...product, id: variant.sku, stock: variant.stock, variants: [variant] }
}

/** Catálogo más una línea por variante: sirve para recuperar el carrito guardado en el navegador. */
export function lineasVendibles(products: Product[]): Product[] {
  return products.flatMap((product) => [
    product,
    ...(product.variants ?? []).map((variant) => productoDeVariante(product, variant)),
  ])
}
