import type { CartItem, Product } from '../types'

const CART_STORAGE_KEY = 'inka-retail-cart'

type StoredCartLine = {
  productId: string
  quantity: number
}

type CartStorage = Pick<Storage, 'getItem' | 'setItem'>

function isStoredCartLine(value: unknown): value is StoredCartLine {
  return (
    typeof value === 'object' &&
    value !== null &&
    'productId' in value &&
    'quantity' in value &&
    typeof value.productId === 'string' &&
    typeof value.quantity === 'number'
  )
}

export function loadCart(products: Product[], storage: CartStorage): CartItem[] {
  try {
    const serialized = storage.getItem(CART_STORAGE_KEY)
    if (!serialized) return []

    const parsed: unknown = JSON.parse(serialized)
    if (!Array.isArray(parsed)) return []

    return parsed.flatMap((entry: unknown) => {
      if (!isStoredCartLine(entry) || !Number.isInteger(entry.quantity) || entry.quantity < 1) {
        return []
      }

      const product = products.find((item) => item.id === entry.productId)
      if (!product || product.stock < 1) return []

      return [{ product, quantity: Math.min(entry.quantity, product.stock) }]
    })
  } catch (error) {
    console.warn('No se pudo recuperar el carrito guardado; se iniciará uno vacío.', error)
    return []
  }
}

export function saveCart(items: CartItem[], storage: CartStorage): void {
  try {
    const serialized: StoredCartLine[] = items.map(({ product, quantity }) => ({
      productId: product.id,
      quantity,
    }))
    storage.setItem(CART_STORAGE_KEY, JSON.stringify(serialized))
  } catch (error) {
    console.warn('No se pudo guardar el carrito en este navegador.', error)
  }
}
