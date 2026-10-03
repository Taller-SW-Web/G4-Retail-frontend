import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ClienteVenta, ItemCarrito, VentaFinalizada } from '../types'

interface CartState {
  items: ItemCarrito[]
  cliente: ClienteVenta | null
  /** Última venta cobrada: alimenta la pantalla de comprobante (RF-15). */
  ultimaVenta: VentaFinalizada | null
  agregar: (item: Omit<ItemCarrito, 'cantidad'>) => boolean
  cambiarCantidad: (sku: string, cantidad: number) => void
  quitar: (sku: string) => void
  vaciar: () => void
  asociarCliente: (cliente: ClienteVenta | null) => void
  cargar: (items: ItemCarrito[], cliente: ClienteVenta | null) => void
  registrarVenta: (venta: VentaFinalizada) => void
  nuevaVenta: () => void
}

// RF-10: el carrito se persiste en localStorage para sobrevivir a recargas de la pestaña.
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      cliente: null,
      ultimaVenta: null,
      agregar: (nuevo) => {
        const actual = get().items.find((i) => i.sku === nuevo.sku)
        if (!actual) {
          if (nuevo.stockTienda < 1) return false
          set({ items: [...get().items, { ...nuevo, cantidad: 1 }] })
          return true
        }
        if (actual.cantidad + 1 > nuevo.stockTienda) return false
        get().cambiarCantidad(nuevo.sku, actual.cantidad + 1)
        return true
      },
      cambiarCantidad: (sku, cantidad) =>
        set({
          items: get().items.map((i) =>
            i.sku === sku ? { ...i, cantidad: Math.min(Math.max(Math.trunc(cantidad) || 1, 1), i.stockTienda) } : i,
          ),
        }),
      quitar: (sku) => set({ items: get().items.filter((i) => i.sku !== sku) }),
      vaciar: () => set({ items: [] }),
      asociarCliente: (cliente) => set({ cliente }),
      cargar: (items, cliente) => set({ items, cliente }),
      registrarVenta: (ultimaVenta) => set({ items: [], cliente: null, ultimaVenta }),
      nuevaVenta: () => set({ items: [], cliente: null, ultimaVenta: null }),
    }),
    { name: 'g4-retail-carrito' },
  ),
)
