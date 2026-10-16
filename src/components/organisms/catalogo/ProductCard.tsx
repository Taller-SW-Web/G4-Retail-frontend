import { IconPlus } from '@tabler/icons-react'
import Button from '../../atoms/Button'
import StockBadge from '../../molecules/StockBadge'
import { getStockStatus } from '../../../lib/inventory'
import { formatCurrency } from '../../../lib/format'
import type { Product } from '../../../types'

type ProductCardProps = {
  product: Product
  onAdd: (product: Product) => void
}

export default function ProductCard({ product, onAdd }: ProductCardProps) {
  const stockStatus = getStockStatus(product.stock)

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-white shadow-sm">
      <div className="relative h-44 overflow-hidden">
        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        {product.badge ? (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--color-accent-volt)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--color-text-primary)]">
            {product.badge}
          </span>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
              {product.category}
            </p>
            <h3 className="mt-1 text-lg font-bold text-[var(--color-text-primary)]">{product.name}</h3>
          </div>
          <span className="text-lg font-bold text-[var(--color-text-primary)]">{formatCurrency(product.price)}</span>
        </div>

        <div className="flex items-center justify-between">
          <StockBadge stock={product.stock} />
          <Button
            variant="primary"
            className="gap-2"
            onClick={() => onAdd(product)}
            disabled={!stockStatus.isAvailable}
          >
            <IconPlus size={16} />
            {stockStatus.isAvailable ? 'Añadir' : 'Agotado'}
          </Button>
        </div>
      </div>
    </article>
  )
}
