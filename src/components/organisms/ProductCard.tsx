import { Badge } from '../atoms/Badge'
import { ProductImage } from '../atoms/ProductImage'
import { formatSoles } from '../../lib/format'
import type { Producto } from '../../types'

interface ProductCardProps {
  producto: Producto
  onSelect: (producto: Producto) => void
}

/** Tarjeta compacta del catálogo: imagen, nombre, marca, disciplina y precio de lista. */
export function ProductCard({ producto, onSelect }: ProductCardProps) {
  const sinStockEnTienda = producto.variantes.every((v) => v.stockTienda === 0)
  return (
    <button
      type="button"
      onClick={() => onSelect(producto)}
      className="flex items-center gap-4 rounded-xl border border-border-default bg-white p-2 text-left transition-shadow hover:shadow-md"
    >
      <ProductImage categoria={producto.categoria} size={32} className="size-16 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="text-sm leading-5 font-bold">{producto.nombre}</h3>
        <p className="truncate text-xs text-text-secondary">
          {producto.marca} · {producto.disciplina}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-semibold tabular-nums">{formatSoles(producto.precioBase)}</span>
          {sinStockEnTienda && <Badge tono="neutral">Sin stock en tienda</Badge>}
        </div>
      </div>
    </button>
  )
}
