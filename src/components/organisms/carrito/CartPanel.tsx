import { IconMinus, IconPlus, IconTrash } from '@tabler/icons-react'
import Button from '../../atoms/Button'
import EmptyState from '../../molecules/EmptyState'
import { getCartItemCount } from '../../../lib/cart'
import { formatCurrency } from '../../../lib/format'
import type { CartItem } from '../../../types'

type CartPanelProps = {
  items: CartItem[]
  subtotal: number
  onIncrease: (id: string) => void
  onDecrease: (id: string) => void
  onRemove: (id: string) => void
}

export default function CartPanel({
  items,
  subtotal,
  onIncrease,
  onDecrease,
  onRemove,
}: CartPanelProps) {
  return (
    <aside className="rounded-2xl border border-[var(--color-border-default)] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-2xl uppercase text-[var(--color-text-primary)]">Carrito</h2>
        <span className="rounded-full bg-[var(--color-surface-cloud-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text-primary)]">
          {getCartItemCount(items)} unidades
        </span>
      </div>

      <div className="space-y-4">
        {items.length === 0 ? (
          <EmptyState
            title="Tu carrito está vacío"
            description="Añade productos del catálogo para preparar una venta."
          />
        ) : (
          items.map((item) => (
            <div key={item.product.id} className="rounded-xl border border-[var(--color-border-default)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">{item.product.name}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{formatCurrency(item.product.price)} c/u</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(item.product.id)}
                  className="rounded-lg p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-cloud-subtle)]"
                  aria-label={`Eliminar ${item.product.name}`}
                >
                  <IconTrash size={16} />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-lg bg-[var(--color-surface-cloud-subtle)] p-1">
                  <button
                    type="button"
                    onClick={() => onDecrease(item.product.id)}
                    className="rounded-md p-1.5 hover:bg-white"
                    aria-label={`Disminuir cantidad de ${item.product.name}`}
                  >
                    <IconMinus size={14} />
                  </button>
                  <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onIncrease(item.product.id)}
                    className="rounded-md p-1.5 hover:bg-white"
                    aria-label={`Aumentar cantidad de ${item.product.name}`}
                  >
                    <IconPlus size={14} />
                  </button>
                </div>

                <span className="font-bold text-[var(--color-text-primary)]">
                  {formatCurrency(item.product.price * item.quantity)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 border-t border-[var(--color-border-default)] pt-4">
        <div className="mb-4 flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="mb-4 flex items-center justify-between text-base font-bold text-[var(--color-text-primary)]">
          <span>Total</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <Button className="w-full" variant="primary" disabled={items.length === 0}>
          Continuar al pago
        </Button>
      </div>
    </aside>
  )
}
