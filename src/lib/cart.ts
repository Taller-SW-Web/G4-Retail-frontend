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

/**
 * Calcula el desglose tributario según normativa SUNAT (RF-12).
 * Base imponible: total / 1.18, IGV 18%: total - base.
 */
export function calcularTotales(items: CartItem[], cupon?: string): import('../types').TotalesCarrito {
  const subtotalBruto = getCartSubtotal(items)
  const cuponLimpio = cupon?.trim().toUpperCase()
  const aplica10 = cuponLimpio === 'VERANO2026' || cuponLimpio === 'DESCUENTO10'
  const descuentoTotal = aplica10 ? Math.round(subtotalBruto * 10) / 100 : 0
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
