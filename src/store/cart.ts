/**
 * Estado global del carrito de compras POS (F4).
 *
 * Conforme a AGENTS.md §2.4, este es uno de los tres estados globales autorizados a vivir en Zustand
 * (sesión, turno de caja y carrito).
 *
 * Responsabilidades (RF-10, RF-11, RF-12):
 * - Control reactivo de líneas y validación estricta de existencias físicas (`product.stock`).
 * - Asociación del cliente identificado en mostrador (F3).
 * - Aplicación de cupones comerciales y promociones en mostrador.
 * - Suspensión y reanudación de carritos en espera para probadores (Held Carts).
 * - Sincronización transparente con localStorage para sobrevivir a recargas de pestaña.
 */
import { create } from 'zustand'
import { addProductToCart, removeCartItem, setCartItemQuantity } from '../lib/cart'
import type { CarritoEspera, CartItem, ClienteVenta, Product } from '../types'

const HELD_CARTS_KEY = 'inka-retail-held-carts'

function loadHeldCarts(): CarritoEspera[] {
  try {
    const raw = localStorage.getItem(HELD_CARTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHeldCarts(list: CarritoEspera[]) {
  try {
    localStorage.setItem(HELD_CARTS_KEY, JSON.stringify(list))
  } catch {
    // Ignore storage quota errors
  }
}

interface CartStore {
  items: CartItem[]
  cliente: ClienteVenta | null
  cupon: string
  carritosEnEspera: CarritoEspera[]

  agregarProducto: (product: Product) => boolean
  aumentarCantidad: (productId: string) => void
  disminuirCantidad: (productId: string) => void
  quitarProducto: (productId: string) => void
  vaciarCarrito: () => void
  setCliente: (cliente: ClienteVenta | null) => void
  aplicarCupon: (cupon: string) => void
  pausarVenta: (alias: string) => boolean
  reanudarVenta: (carritoEsperaId: string) => boolean
  eliminarVentaEnEspera: (carritoEsperaId: string) => void
  cargarCarrito: (items: CartItem[], cliente?: ClienteVenta | null) => void
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  cliente: null,
  cupon: '',
  carritosEnEspera: loadHeldCarts(),

  agregarProducto: (product) => {
    if (product.stock < 1) return false
    const previous = get().items
    const updated = addProductToCart(previous, product)
    const agregado = updated !== previous
    if (agregado) {
      set({ items: updated })
    }
    return agregado
  },

  aumentarCantidad: (productId) => {
    const item = get().items.find((i) => i.product.id === productId)
    if (!item) return
    const updated = setCartItemQuantity(get().items, productId, item.quantity + 1)
    set({ items: updated })
  },

  disminuirCantidad: (productId) => {
    const item = get().items.find((i) => i.product.id === productId)
    if (!item) return
    const updated = setCartItemQuantity(get().items, productId, item.quantity - 1)
    set({ items: updated })
  },

  quitarProducto: (productId) => {
    const updated = removeCartItem(get().items, productId)
    set({ items: updated })
  },

  vaciarCarrito: () => set({ items: [], cupon: '' }),

  setCliente: (cliente) => set({ cliente }),

  aplicarCupon: (cupon) => set({ cupon: cupon.trim().toUpperCase() }),

  pausarVenta: (alias) => {
    const { items, cliente, carritosEnEspera } = get()
    if (items.length === 0 || !alias.trim()) return false

    const ahora = new Date()
    const expiracion = new Date(ahora.getTime() + 2 * 60 * 60 * 1000)

    const nuevoHeld: CarritoEspera = {
      carritoEsperaId: crypto.randomUUID ? crypto.randomUUID() : `held-${Date.now()}`,
      aliasTicket: alias.trim(),
      items: [...items],
      cliente: cliente ? { ...cliente } : null,
      fechaHoraInicio: ahora.toISOString(),
      expiracion: expiracion.toISOString(),
    }

    const nuevaLista = [...carritosEnEspera, nuevoHeld]
    saveHeldCarts(nuevaLista)
    set({ items: [], cliente: null, cupon: '', carritosEnEspera: nuevaLista })
    return true
  },

  reanudarVenta: (carritoEsperaId) => {
    const { items, carritosEnEspera } = get()
    // No permitir sobreescribir si ya hay prendas en el mostrador
    if (items.length > 0) return false

    const seleccionado = carritosEnEspera.find((c) => c.carritoEsperaId === carritoEsperaId)
    if (!seleccionado) return false

    const filtrados = carritosEnEspera.filter((c) => c.carritoEsperaId !== carritoEsperaId)
    saveHeldCarts(filtrados)

    set({
      items: seleccionado.items,
      cliente: seleccionado.cliente,
      cupon: '',
      carritosEnEspera: filtrados,
    })
    return true
  },

  eliminarVentaEnEspera: (carritoEsperaId) => {
    const filtrados = get().carritosEnEspera.filter((c) => c.carritoEsperaId !== carritoEsperaId)
    saveHeldCarts(filtrados)
    set({ carritosEnEspera: filtrados })
  },

  cargarCarrito: (items, cliente = null) => {
    set({ items, cliente })
  },
}))
