import { useEffect, useState, type KeyboardEvent } from 'react'
import { IconPlus, IconX } from '@tabler/icons-react'
import Button from '../../atoms/Button'
import StockBadge from '../../molecules/StockBadge'
import { getStockStatus } from '../../../lib/inventory'
import { formatCurrency } from '../../../lib/format'
import type { Product, Variant } from '../../../types'

type ProductDetailModalProps = {
  product: Product
  /** Variante preseleccionada cuando se llegó escaneando su etiqueta. */
  initialSku?: string
  onAdd: (product: Product) => void
  onClose: () => void
}

/** Las flechas recorren las opciones del grupo: en mostrador se elige la talla sin soltar el lector. */
function moveFocus(event: KeyboardEvent<HTMLDivElement>) {
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
  if (!step) return

  event.preventDefault()
  const options = [...event.currentTarget.querySelectorAll('button')]
  const current = options.indexOf(document.activeElement as HTMLButtonElement)
  options[(current + step + options.length) % options.length]?.focus()
}

const optionStyle = (selected: boolean, disabled: boolean) =>
  [
    // 44x44 px mínimos: es el tamaño que un dedo acierta sin mirar (RNF-05).
    'min-h-11 min-w-11 rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-colors',
    disabled
      ? 'cursor-not-allowed border-[var(--color-border-default)] text-[var(--color-text-secondary)] line-through opacity-60'
      : selected
        ? 'border-[var(--color-surface-ink)] bg-[var(--color-surface-ink)] text-[var(--color-text-inverse)]'
        : 'border-[var(--color-border-default)] bg-white text-[var(--color-text-primary)] hover:bg-[var(--color-surface-cloud-subtle)]',
  ].join(' ')

/**
 * Ficha del artículo con su matriz de talla y color (RF-05) y su semáforo de stock (RF-06).
 *
 * Una prenda no se vende "en general": se vende una talla de un color. Esta ficha obliga a elegir
 * esa combinación antes de habilitar el botón, y deja las variantes sin existencias visibles pero
 * bloqueadas, porque esconderlas haría pensar que el modelo no existe cuando lo que falta es la
 * talla.
 */
export default function ProductDetailModal({
  product,
  initialSku,
  onAdd,
  onClose,
}: ProductDetailModalProps) {
  const variants = product.variants ?? []
  const scanned = variants.find((variant) => variant.sku === initialSku)
  const colors = [...new Set(variants.map((variant) => variant.color))]

  const [color, setColor] = useState(scanned?.color ?? colors[0])
  const [size, setSize] = useState<string | null>(scanned?.size ?? null)

  // Escape cierra la ficha: el vendedor se equivocó de artículo y necesita volver sin buscar el aspa.
  useEffect(() => {
    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [onClose])

  const sizesOfColor = variants.filter((variant) => variant.color === color)
  const selected: Variant | undefined = sizesOfColor.find((variant) => variant.size === size)
  const stock = selected ? getStockStatus(selected.stock) : null
  const canSell = selected ? stock!.isAvailable : variants.length === 0 && product.stock > 0

  const changeColor = (next: string) => {
    setColor(next)
    // La talla elegida puede no existir en el color nuevo, así que se vuelve a preguntar
    // en lugar de arrastrar una selección que ya no corresponde a ninguna prenda real.
    setSize(null)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-ficha"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--color-border-default)] p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
              {product.category}
            </p>
            <h2 id="titulo-ficha" className="font-heading mt-1 text-2xl text-[var(--color-text-primary)]">
              {product.name}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Cerrar ficha del artículo"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-cloud-subtle)]"
          >
            <IconX size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="grid gap-5 p-5 sm:grid-cols-[200px_minmax(0,1fr)]">
          <img
            src={product.image}
            alt={product.name}
            className="h-48 w-full rounded-xl object-cover sm:h-full"
          />

          <div className="space-y-5">
            {colors.length > 0 ? (
              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">Color</legend>
                <div className="flex flex-wrap gap-2" onKeyDown={moveFocus}>
                  {colors.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={option === color}
                      onClick={() => changeColor(option)}
                      className={optionStyle(option === color, false)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {sizesOfColor.length > 0 ? (
              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">Talla</legend>
                <div className="flex flex-wrap gap-2" onKeyDown={moveFocus}>
                  {sizesOfColor.map((variant) => {
                    const agotada = variant.stock <= 0
                    return (
                      <button
                        key={variant.sku}
                        type="button"
                        disabled={agotada}
                        aria-pressed={variant.size === size}
                        title={agotada ? 'Agotada en esta tienda' : `SKU ${variant.sku}`}
                        onClick={() => setSize(variant.size)}
                        className={optionStyle(variant.size === size, agotada)}
                      >
                        {variant.size}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-2xl font-bold text-[var(--color-text-primary)]">
                {formatCurrency(product.price)}
              </span>
              {selected ? <StockBadge stock={selected.stock} /> : null}
            </div>

            {selected ? (
              <p className="text-sm text-[var(--color-text-secondary)]">
                SKU <span className="font-semibold tabular-nums">{selected.sku}</span> · código{' '}
                <span className="tabular-nums">{selected.barcode}</span>
              </p>
            ) : variants.length > 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)]">
                Elige talla y color para ver la disponibilidad en esta tienda.
              </p>
            ) : null}

            <Button
              variant="primary"
              className="w-full gap-2"
              disabled={!canSell}
              onClick={() => {
                onAdd(product)
                onClose()
              }}
            >
              <IconPlus size={16} aria-hidden="true" />
              {canSell ? 'Agregar al carrito' : stock ? stock.label : 'Elige una variante'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
