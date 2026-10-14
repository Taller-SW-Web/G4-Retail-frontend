import { useMemo, useState } from 'react'
import LoginPage from './pages/LoginPage'
import PosPage from './pages/PosPage'
import { products } from './data/products'
import type { CartItem, Product } from './types'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return products

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        product.id.toLowerCase().includes(term)
      )
    })
  }, [search])

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id)

      if (existing) {
        return current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }

      return [...current, { product, quantity: 1 }]
    })
  }

  const increaseQuantity = (productId: string) => {
    setCart((current) =>
      current.map((item) =>
        item.product.id === productId ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    )
  }

  const decreaseQuantity = (productId: string) => {
    setCart((current) =>
      current
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((current) => current.filter((item) => item.product.id !== productId))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />
  }

  return (
    <PosPage
      products={filteredProducts}
      cart={cart}
      addToCart={addToCart}
      increaseQuantity={increaseQuantity}
      decreaseQuantity={decreaseQuantity}
      removeFromCart={removeFromCart}
      subtotal={subtotal}
      search={search}
      onSearchChange={setSearch}
    />
  )
}
