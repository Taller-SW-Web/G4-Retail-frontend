import { IconTrash } from '@tabler/icons-react'
import { ActionIcon } from '../atoms/ActionIcon'
import { ProductImage } from '../atoms/ProductImage'
import { QuantityStepper } from '../molecules/QuantityStepper'
import { useCartStore } from '../../store/cart'
import { formatSoles } from '../../lib/format'
import type { ItemCarrito } from '../../types'

/** Línea compacta del carrito POS: miniatura, variante, cantidad, importe y eliminar (RF-10). */
export function CartLine({ item }: { item: ItemCarrito }) {
  const cambiarCantidad = useCartStore((s) => s.cambiarCantidad)
  const quitar = useCartStore((s) => s.quitar)
  const enMaximo = item.cantidad >= item.stockTienda
  return (
    <li className="flex items-center gap-2 py-1">
      <ProductImage categoria={item.categoria} size={20} className="size-10 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold" title={item.nombre}>
          {item.nombre}
        </p>
        <p className="truncate text-xs text-text-secondary">
          Talla {item.talla} · {item.color} · {formatSoles(item.precioUnitario)} c/u
        </p>
        {enMaximo && <p className="text-xs text-text-secondary">Stock máximo en tienda alcanzado</p>}
      </div>
      <QuantityStepper
        cantidad={item.cantidad}
        max={item.stockTienda}
        nombre={item.nombre}
        onChange={(cantidad) => cambiarCantidad(item.sku, cantidad)}
        onRemove={() => quitar(item.sku)}
      />
      <span className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums">{formatSoles(item.precioUnitario * item.cantidad)}</span>
      <ActionIcon aria-label={`Quitar ${item.nombre} del carrito`} tone="danger" onClick={() => quitar(item.sku)}>
        <IconTrash size={20} aria-hidden />
      </ActionIcon>
    </li>
  )
}
