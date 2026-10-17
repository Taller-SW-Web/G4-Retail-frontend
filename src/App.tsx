import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRouter from './router/AppRouter'
import { products } from './data/products'
import { getCartSubtotal } from './lib/cart'
import { loadCart, saveCart } from './lib/cartStorage'
import { filterProducts } from './lib/catalog'
import { useAuthStore } from './store/authStore'
import { useCartStore } from './store/cart'
import type { Product } from './types'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Si quedo un token vigente, se entra sin volver a pedir credenciales: un vendedor no deberia
  // reloguearse solo por refrescar la pagina en medio de una atencion.
  useEffect(() => {
    void useAuthStore
      .getState()
      .restaurarSesion()
      .then(() => setIsAuthenticated(useAuthStore.getState().autenticado()))

    const inicial = loadCart(products, window.localStorage)
    if (inicial.length > 0) {
      useCartStore.getState().cargarCarrito(inicial)
    }
  }, [])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todas')
  const cart = useCartStore((s) => s.items)

  useEffect(() => {
    saveCart(cart, window.localStorage)
  }, [cart])

  const filteredProducts = useMemo(() => {
    return filterProducts(products, search, category)
  }, [search, category])

  const addToCart = (product: Product) => useCartStore.getState().agregarProducto(product)
  const increaseQuantity = (productId: string) => useCartStore.getState().aumentarCantidad(productId)
  const decreaseQuantity = (productId: string) => useCartStore.getState().disminuirCantidad(productId)
  const removeFromCart = (productId: string) => useCartStore.getState().quitarProducto(productId)

  const subtotal = getCartSubtotal(cart)
  // Sin 'Todas': esa opción la pone CategoryFilter, y agregarla aquí la duplicaba en la barra.
  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [])

  return (
    <BrowserRouter>
      <AppRouter
        isAuthenticated={isAuthenticated}
        onLogin={() => setIsAuthenticated(true)}
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
        categories={categories}
        onCategoryChange={setCategory}
      />
    </BrowserRouter>
  )
}
