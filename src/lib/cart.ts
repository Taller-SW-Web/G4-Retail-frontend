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
