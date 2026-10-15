import { useMemo, useState } from 'react'
import LoginPage from './pages/LoginPage'
import PosPage from './pages/PosPage'
import { products } from './data/products'
import { addProductToCart, getCartSubtotal, removeCartItem, setCartItemQuantity } from './lib/cart'
import { filterProducts } from './lib/catalog'
import type { CartItem, Product } from './types'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todas')
  const [cart, setCart] = useState<CartItem[]>([])

  const filteredProducts = useMemo(() => {
    return filterProducts(products, search, category)
  }, [search, category])

  const addToCart = (product: Product) => setCart((current) => addProductToCart(current, product))

  const increaseQuantity = (productId: string) => {
    setCart((current) => {
      const item = current.find((currentItem) => currentItem.product.id === productId)
      return item
        ? setCartItemQuantity(current, productId, item.quantity + 1)
        : current
    })
  }

  const decreaseQuantity = (productId: string) => {
    setCart((current) => {
      const item = current.find((currentItem) => currentItem.product.id === productId)
      return item
        ? setCartItemQuantity(current, productId, item.quantity - 1)
        : current
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((current) => removeCartItem(current, productId))
  }

  const subtotal = getCartSubtotal(cart)

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
      category={category}
      categories={[...new Set(products.map((product) => product.category))]}
      onCategoryChange={setCategory}
    />
  )
}
