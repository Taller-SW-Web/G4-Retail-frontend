import { IconTrash } from '@tabler/icons-react'
import { ActionIcon } from '../atoms/ActionIcon'
import { ProductImage } from '../atoms/ProductImage'
import { QuantityStepper } from '../molecules/QuantityStepper'
import { useCartStore } from '../../store/cart'
import { formatSoles } from '../../lib/format'
import type { ItemCarrito } from '../../types'

/** Línea del carrito POS: miniatura, variante, precio y controles de cantidad (RF-10). */
export function CartLine({ item }: { item: ItemCarrito }) {
  const cambiarCantidad = useCartStore((s) => s.cambiarCantidad)
  const quitar = useCartStore((s) => s.quitar)
  return (
    <li className="flex gap-2 py-4">
      <ProductImage categoria={item.categoria} size={24} className="size-12 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{item.nombre}</p>
            <p className="text-xs text-text-secondary">
              Talla {item.talla} · {item.color} · {formatSoles(item.precioUnitario)} c/u
            </p>
          </div>
          <ActionIcon aria-label={`Quitar ${item.nombre} del carrito`} tone="danger" onClick={() => quitar(item.sku)}>
            <IconTrash size={20} aria-hidden />
          </ActionIcon>
        </div>
        <div className="flex items-center justify-between gap-2">
          <QuantityStepper
            cantidad={item.cantidad}
            max={item.stockTienda}
            nombre={item.nombre}
            onChange={(cantidad) => cambiarCantidad(item.sku, cantidad)}
            onRemove={() => quitar(item.sku)}
          />
          <span className="text-sm font-semibold tabular-nums">{formatSoles(item.precioUnitario * item.cantidad)}</span>
        </div>
        {item.cantidad >= item.stockTienda && <p className="text-xs text-text-secondary">Stock máximo disponible en tienda alcanzado</p>}
      </div>
    </li>
  )
}
