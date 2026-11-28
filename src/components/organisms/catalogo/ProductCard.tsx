import { IconPlus } from '@tabler/icons-react'
import Button from '../../atoms/Button'
import StockBadge from '../../molecules/StockBadge'
import { getStockStatus } from '../../../lib/inventory'
import { formatCurrency } from '../../../lib/format'
import type { Product } from '../../../types'

type ProductCardProps = {
  product: Product
  onAdd: (product: Product) => void
  /** Abre la ficha con la matriz de talla y color (RF-05). */
  onOpen?: (product: Product) => void
}

export default function ProductCard({ product, onAdd, onOpen }: ProductCardProps) {
  const stockStatus = getStockStatus(product)
  // G6 cotiza por SKU; sin precio vigente el backend rechazaría la venta, así que no se ofrece.
  const conPrecio = product.price > 0
  // Con tallas y colores no se puede añadir desde la tarjeta: habría que adivinar cuál se vende.
  const hasVariants = Boolean(product.variants?.length)

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
            <h3 className="mt-1 text-lg font-bold text-[var(--color-text-primary)]">
              {onOpen ? (
                <button
                  type="button"
                  onClick={() => onOpen(product)}
                  className="text-left hover:underline"
                >
                  {product.name}
                </button>
              ) : (
                product.name
              )}
            </h3>
          </div>
          {conPrecio ? (
            <span className="shrink-0 text-lg font-bold text-[var(--color-text-primary)]">
              {product.variants?.some((v) => v.price != null && v.price !== product.price) ? (
                <span className="mr-1 text-xs font-semibold text-[var(--color-text-secondary)]">desde</span>
              ) : null}
              {formatCurrency(product.price)}
            </span>
          ) : (
            <span className="shrink-0 text-sm font-semibold text-[var(--color-text-secondary)]">Precio por confirmar</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <StockBadge
            stock={product.stock}
            disponibilidad={product.disponibilidad}
            stockConocido={product.stockConocido}
            enCuarentena={product.enCuarentena}
          />
          <Button
            variant="primary"
            className="gap-2"
            onClick={() => (hasVariants && onOpen ? onOpen(product) : onAdd(product))}
            disabled={!stockStatus.isAvailable || (!hasVariants && !conPrecio)}
          >
            <IconPlus size={16} aria-hidden="true" />
            {!stockStatus.isAvailable ? 'No disponible' : hasVariants ? 'Elegir talla' : conPrecio ? 'Añadir' : 'Sin precio'}
          </Button>
        </div>
      </div>
    </article>
  )
}
