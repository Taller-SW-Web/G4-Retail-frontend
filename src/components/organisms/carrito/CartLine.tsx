import { IconMinus, IconPlus, IconTrash } from '@tabler/icons-react'
import { formatCurrency } from '../../../lib/format'
import { useCartStore } from '../../../store/cart'
import type { CartItem } from '../../../types'

interface CartLineProps {
  item: CartItem
}

/**
 * Control de línea compacta del carrito POS (RF-10):
 * Detalle del producto, stepper con tope de existencias locales físicas y eliminación.
 */
export default function CartLine({ item }: CartLineProps) {
  const aumentarCantidad = useCartStore((s) => s.aumentarCantidad)
  const disminuirCantidad = useCartStore((s) => s.disminuirCantidad)
  const quitarProducto = useCartStore((s) => s.quitarProducto)

  const enMaximoStock = item.quantity >= item.product.stock

  return (
    <div className="rounded-xl border border-[var(--color-border-default)] bg-white p-3 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[var(--color-text-primary)]" title={item.product.name}>
            {item.product.name}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {item.product.category} · {formatCurrency(item.product.price)} c/u
          </p>
          {enMaximoStock && (
            <p className="mt-0.5 text-xs font-medium text-[var(--color-accent-signal)]">
              Stock máximo en tienda alcanzado ({item.product.stock} un.)
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => quitarProducto(item.product.id)}
          className="rounded-lg p-1.5 text-[var(--color-text-secondary)] transition-colors hover:bg-red-50 hover:text-red-600"
          aria-label={`Eliminar ${item.product.name}`}
          title="Eliminar artículo"
        >
          <IconTrash size={18} aria-hidden />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-cloud-subtle)] p-1">
          <button
            type="button"
            onClick={() => disminuirCantidad(item.product.id)}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-[var(--color-text-primary)] shadow-xs transition-colors hover:bg-slate-100 disabled:opacity-40"
            aria-label={`Disminuir cantidad de ${item.product.name}`}
          >
            <IconMinus size={14} aria-hidden />
          </button>
          <span className="min-w-7 text-center text-sm font-bold text-[var(--color-text-primary)]">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => aumentarCantidad(item.product.id)}
            disabled={enMaximoStock}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-[var(--color-text-primary)] shadow-xs transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Aumentar cantidad de ${item.product.name}`}
          >
            <IconPlus size={14} aria-hidden />
          </button>
        </div>

        <span className="font-bold tabular-nums text-[var(--color-text-primary)]">
          {formatCurrency(item.product.price * item.quantity)}
        </span>
      </div>
    </div>
  )
}
