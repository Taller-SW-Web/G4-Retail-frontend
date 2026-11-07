import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRouter from './router/AppRouter'
import { useCatalogoTienda } from './hooks/useCatalogoTienda'
import { getCartSubtotal } from './lib/cart'
import { saveCart } from './lib/cartStorage'
import { filterProducts } from './lib/catalog'
import { useAuthStore } from './store/authStore'
import { useCartStore } from './store/cart'
import { ContingenciaProvider } from './context/ContingenciaContext'
import type { Product } from './types'

export default function App() {
  // El mismo criterio que usa ProtectedRoute: token, perfil y token no vencido.
  const isAuthenticated = useAuthStore((s) => s.autenticado())

  // Si quedo un token vigente, se entra sin volver a pedir credenciales: un vendedor no deberia
  // reloguearse solo por refrescar la pagina en medio de una atencion.
  useEffect(() => {
    void useAuthStore.getState().restaurarSesion()
  }, [])

  // F2: catálogo de la tienda desde Retail, con los mismos SKU que valida la venta.
  const products = useCatalogoTienda(isAuthenticated)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todas')
  const cart = useCartStore((s) => s.items)

  useEffect(() => {
    saveCart(cart, window.localStorage)
  }, [cart])

  const filteredProducts = useMemo(() => {
    return filterProducts(products, search, category)
  }, [products, search, category])

  const addToCart = (product: Product) => useCartStore.getState().agregarProducto(product)
  const increaseQuantity = (productId: string) => useCartStore.getState().aumentarCantidad(productId)
  const decreaseQuantity = (productId: string) => useCartStore.getState().disminuirCantidad(productId)
  const removeFromCart = (productId: string) => useCartStore.getState().quitarProducto(productId)

  const subtotal = getCartSubtotal(cart)
  // Sin 'Todas': esa opción la pone CategoryFilter, y agregarla aquí la duplicaba en la barra.
  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products])

  return (
    <BrowserRouter>
      <ContingenciaProvider>
        <AppRouter
          isAuthenticated={isAuthenticated}
          onLogin={() => {}}
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
      </ContingenciaProvider>
    </BrowserRouter>
  )
}
