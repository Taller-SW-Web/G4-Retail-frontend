import type { Product, Variant } from '../types'

export type ScanMatch = {
  product: Product
  variant?: Variant
}

/**
 * Resuelve lo que acaba de leer el lector láser (RF-04).
 *
 * El vendedor dispara sobre la etiqueta de una prenda concreta, así que lo que interesa no es el
 * modelo sino la variante exacta: esa talla, ese color. Por eso se busca primero entre los códigos
 * de barras y los SKU, y solo si no hay etiqueta que coincida se cae al identificador del producto,
 * que es lo que queda cuando el artículo no tiene variantes.
 *
 * Devuelve `null` si el código no corresponde a nada: una etiqueta ajena al catálogo no debe
 * seleccionar "lo más parecido", porque terminaría vendiendo otra prenda.
 */
export function resolveScan(products: Product[], code: string): ScanMatch | null {
  const read = code.trim().toLowerCase()
  if (!read) return null

  for (const product of products) {
    const variant = product.variants?.find(
      (candidate) => candidate.barcode === read || candidate.sku.toLowerCase() === read,
    )
    if (variant) return { product, variant }
  }

  const product = products.find((candidate) => candidate.id.toLowerCase() === read)
  return product ? { product } : null
}

/**
 * Códigos reales del catálogo para poder demostrar el lector sin etiquetas físicas.
 *
 * Se toma la primera variante de cada artículo: alcanza para probar el flujo y mantiene la lista
 * corta, que en mostrador es una fila de botones y no un listado para leer.
 */
export function sampleBarcodes(products: Product[], limit = 4): Array<{ code: string; label: string }> {
  return products
    .filter((product) => product.variants?.length)
    .slice(0, limit)
    .map((product) => ({
      code: product.variants![0].barcode,
      label: `${product.name} · ${product.variants![0].size}`,
    }))
}
