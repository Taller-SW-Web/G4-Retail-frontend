export type Variant = {
  /** SKU vendible: la combinación exacta de talla y color que entra al carrito. */
  sku: string
  /** Etiqueta EAN-13 que lee el lector láser. No es el SKU: son códigos distintos. */
  barcode: string
  size: string
  color: string
  stock: number
}

export type Product = {
  id: string
  name: string
  category: string
  price: number
  stock: number
  image: string
  badge?: string
  /**
   * Variantes de talla y color (RF-05). Es opcional porque no todo artículo las tiene:
   * una mancuerna de 12 kg se vende sin tallas y su ficha no debe inventar una matriz.
   */
  variants?: Variant[]
}

export type CartItem = {
  product: Product
  quantity: number
}
