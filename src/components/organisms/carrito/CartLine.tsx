import { IconMinus, IconPlus, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { formatCurrency } from '../../../lib/format'
import { useCartStore } from '../../../store/cart'
import type { CartItem } from '../../../types'
import type { LineaCalculo } from '../../../api/carritoApi'

interface CartLineProps {
  item: CartItem
  /** Línea calculada por el backend (§5.4). Si trae descuento, se tacha el precio regular (RF-11). */
  linea?: LineaCalculo
}

/**
 * Control de línea compacta del carrito POS (RF-10, RF-11):
 * Detalle del producto, stepper con tope de existencias locales físicas y eliminación. Si una
 * promoción o cupón beneficia la línea, tacha el precio regular y muestra el rebajado.
 */
export default function CartLine({ item, linea }: CartLineProps) {
  const aumentarCantidad = useCartStore((s) => s.aumentarCantidad)
  const disminuirCantidad = useCartStore((s) => s.disminuirCantidad)
  const fijarCantidad = useCartStore((s) => s.fijarCantidad)
  const quitarProducto = useCartStore((s) => s.quitarProducto)
  const [borrador, setBorrador] = useState<string | null>(null)

  const enMaximoStock = item.quantity >= item.product.stock
  // Solo si la línea calculada corresponde a la cantidad actual (mientras recalcula, se muestra sin rebaja).
  const conDescuento = !!linea && linea.descuento > 0 && linea.cantidad === item.quantity
  // RF-05: la línea corresponde a una variante concreta cuando el artículo tiene tallas o colores.
  const variante = item.product.variants?.length === 1 ? item.product.variants[0] : undefined

  return (
    <div className="rounded-xl border border-[var(--color-border-default)] bg-white p-3 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[var(--color-text-primary)]" title={item.product.name}>
            {item.product.name}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {item.product.category}
            {variante ? ` · Talla ${variante.size} · ${variante.color}` : ''} · {formatCurrency(item.product.price)} c/u
          </p>
          {enMaximoStock && (
            <p className="mt-0.5 text-xs font-medium text-[var(--color-accent-signal)]">
              {item.product.stockConocido === false
                ? 'Cantidad máxima por línea: confirma existencias en tienda'
                : `Stock máximo en tienda alcanzado (${item.product.stock} un.)`}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => quitarProducto(item.product.id)}
          className="rounded-lg p-1.5 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-error-bg)] hover:text-[var(--color-error)]"
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
            className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-[var(--color-text-primary)] shadow-xs transition-colors hover:bg-[var(--color-surface-cloud-subtle)] disabled:opacity-40"
            aria-label={`Disminuir cantidad de ${item.product.name}`}
          >
            <IconMinus size={14} aria-hidden />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={item.product.stock}
            aria-label={`Cantidad de ${item.product.name}`}
            value={borrador ?? item.quantity}
            onChange={(evento) => {
              const { value, valueAsNumber } = evento.currentTarget
              if (Number.isInteger(valueAsNumber) && valueAsNumber >= 1 && valueAsNumber <= item.product.stock) {
                fijarCantidad(item.product.id, valueAsNumber)
                setBorrador(null)
              } else {
                setBorrador(value)
              }
            }}
            onBlur={() => setBorrador(null)}
            className="h-7 w-10 rounded-sm bg-transparent text-center text-sm font-bold text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-action-primary)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => aumentarCantidad(item.product.id)}
            disabled={enMaximoStock}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-[var(--color-text-primary)] shadow-xs transition-colors hover:bg-[var(--color-surface-cloud-subtle)] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Aumentar cantidad de ${item.product.name}`}
          >
            <IconPlus size={14} aria-hidden />
          </button>
        </div>

        {conDescuento && linea ? (
          <span className="flex flex-col items-end leading-tight">
            <s className="text-xs tabular-nums text-[var(--color-text-secondary)]" aria-label="Precio regular">
              {formatCurrency(linea.precioUnitario * linea.cantidad)}
            </s>
            <span className="font-bold tabular-nums text-[var(--color-success)]" aria-label="Precio con descuento">
              {formatCurrency(linea.precioFinal)}
            </span>
            {linea.promocionAplicada && (
              <span className="text-[11px] text-[var(--color-success)]">{linea.promocionAplicada}</span>
            )}
          </span>
        ) : (
          <span className="font-bold tabular-nums text-[var(--color-text-primary)]">
            {formatCurrency(item.product.price * item.quantity)}
          </span>
        )}
      </div>
    </div>
  )
}
