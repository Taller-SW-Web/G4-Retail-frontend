import type { CartItem, Product } from '../types'

export function getCartSubtotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.product.price * item.quantity, 0)
}

export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0)
}

export function addProductToCart(items: CartItem[], product: Product): CartItem[] {
  if (product.stock < 1) return items

  const existingItem = items.find((item) => item.product.id === product.id)
  if (!existingItem) return [...items, { product, quantity: 1 }]
  if (existingItem.quantity >= product.stock) return items

  return items.map((item) =>
    item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
  )
}

export function setCartItemQuantity(
  items: CartItem[],
  productId: string,
  quantity: number,
): CartItem[] {
  if (quantity <= 0) return items.filter((item) => item.product.id !== productId)

  return items.map((item) =>
    item.product.id === productId
      ? { ...item, quantity: Math.min(quantity, item.product.stock) }
      : item,
  )
}

export function removeCartItem(items: CartItem[], productId: string): CartItem[] {
  return items.filter((item) => item.product.id !== productId)
}

/** SKU con el que la línea del carrito viaja al backend: el de su variante o, si no tiene, el del producto. */
export function skuDeLinea(item: CartItem): string {
  return item.product.variants?.[0]?.sku || item.product.id
}

/**
 * Desglose tributario SUNAT (RF-12) con el precio de lista y **sin descuentos**: base imponible =
 * total / 1.18 e IGV = total - base.
 *
 * Es el estimado que se muestra sin conexión o mientras responde el backend. Los cupones y las
 * promociones los calcula siempre Retail con Productos (RF-11, `POST /carritos/calcular`).
 */
export function calcularTotales(items: CartItem[]): import('../types').TotalesCarrito {
  const subtotalBruto = getCartSubtotal(items)
  const descuentoTotal = 0
  const totalPagar = Math.max(0, Math.round((subtotalBruto - descuentoTotal) * 100) / 100)
  const baseImponible = Math.round((totalPagar / 1.18) * 100) / 100
  const montoIgv = Math.round((totalPagar - baseImponible) * 100) / 100

  return {
    subtotalBruto,
    descuentoTotal,
    totalPagar,
    baseImponible,
    montoIgv,
  }
}
