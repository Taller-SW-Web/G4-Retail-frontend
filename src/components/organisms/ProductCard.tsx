import { Badge } from '../atoms/Badge'
import { ProductImage } from '../atoms/ProductImage'
import { formatSoles } from '../../lib/format'
import type { Producto } from '../../types'

interface ProductCardProps {
  producto: Producto
  onSelect: (producto: Producto) => void
}

/** Tarjeta de la grilla de catálogo: imagen → nombre, marca, disciplina y precio de lista. */
export function ProductCard({ producto, onSelect }: ProductCardProps) {
  const sinStockEnTienda = producto.variantes.every((v) => v.stockTienda === 0)
  return (
    <button
      type="button"
      onClick={() => onSelect(producto)}
      className="flex flex-col gap-4 rounded-xl border border-border-default bg-white p-4 text-left transition-shadow hover:shadow-md"
    >
      <ProductImage categoria={producto.categoria} className="aspect-4/3 w-full" />
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="text-xl font-bold">{producto.nombre}</h3>
        <p className="text-sm text-text-secondary">
          {producto.marca} · {producto.disciplina}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-lg leading-[26px] font-semibold tabular-nums">{formatSoles(producto.precioBase)}</span>
        {sinStockEnTienda && <Badge tono="neutral">Sin stock en tienda</Badge>}
      </div>
    </button>
  )
}
