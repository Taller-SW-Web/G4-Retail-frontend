import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import PosPage from '../pages/PosPage'
import PickupPage from '../pages/PickupPage'
import CashClosePage from '../pages/CashClosePage'
import ReceiptPage from '../pages/ReceiptPage'
import type { CartItem, Product } from '../types'

type AppRouterProps = {
  isAuthenticated: boolean
  onLogin: () => void
  products: Product[]
  cart: CartItem[]
  addToCart: (product: Product) => void
  increaseQuantity: (productId: string) => void
  decreaseQuantity: (productId: string) => void
  removeFromCart: (productId: string) => void
  subtotal: number
  search: string
  onSearchChange: (search: string) => void
  category: string
  categories: string[]
  onCategoryChange: (category: string) => void
}

export default function AppRouter(props: AppRouterProps) {
  const navigate = useNavigate()

  const handleLogin = () => {
    props.onLogin()
    navigate('/pos')
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage onLogin={handleLogin} />}
      />
      <Route
        path="/pos"
        element={
          props.isAuthenticated ? (
            <PosPage
              products={props.products}
              cart={props.cart}
              addToCart={props.addToCart}
              increaseQuantity={props.increaseQuantity}
              decreaseQuantity={props.decreaseQuantity}
              removeFromCart={props.removeFromCart}
              subtotal={props.subtotal}
              search={props.search}
              onSearchChange={props.onSearchChange}
              category={props.category}
              categories={props.categories}
              onCategoryChange={props.onCategoryChange}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/pickup"
        element={props.isAuthenticated ? <PickupPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/caja/cierre"
        element={props.isAuthenticated ? <CashClosePage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/pos/comprobante"
        element={props.isAuthenticated ? <ReceiptPage /> : <Navigate to="/login" replace />}
      />
      <Route path="/" element={<Navigate to={props.isAuthenticated ? "/pos" : "/login"} replace />} />
      <Route path="*" element={<Navigate to={props.isAuthenticated ? "/pos" : "/login"} replace />} />
    </Routes>
  )
}
