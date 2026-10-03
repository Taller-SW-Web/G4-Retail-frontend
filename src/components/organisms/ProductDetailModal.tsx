import { useState, type KeyboardEvent } from 'react'
import { IconShoppingCartPlus } from '@tabler/icons-react'
import { Button } from '../atoms/Button'
import { ProductImage } from '../atoms/ProductImage'
import { Alert } from '../molecules/Alert'
import { Modal } from '../molecules/Modal'
import { StockBadge } from '../molecules/StockBadge'
import { useCartStore } from '../../store/cart'
import { toast } from '../../store/toast'
import { formatSoles } from '../../lib/format'
import { cx } from '../../lib/cx'
import type { Producto } from '../../types'

interface ProductDetailModalProps {
  producto: Producto
  /** Variante preseleccionada cuando se llegó escaneando su SKU o código de barras. */
  skuInicial?: string
  onClose: () => void
}

/** Las flechas mueven el foco entre las opciones del grupo (navegación por teclado, RF-05). */
function moverFoco(e: KeyboardEvent<HTMLDivElement>) {
  const paso = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
  if (!paso) return
  e.preventDefault()
  const opciones = [...e.currentTarget.querySelectorAll('button')]
  const actual = opciones.indexOf(document.activeElement as HTMLButtonElement)
  opciones[(actual + paso + opciones.length) % opciones.length]?.focus()
}

const opcion = (activa: boolean) =>
  cx(
    'rounded-lg border-2 px-4 py-4 text-sm font-semibold transition-colors',
    activa ? 'border-surface-ink bg-surface-ink text-text-inverse' : 'border-border-default bg-white hover:bg-surface-cloud-subtle',
  )

/** RF-05 / RF-06: matriz de color y talla con SKU, precio y semáforo de stock. */
export function ProductDetailModal({ producto, skuInicial, onClose }: ProductDetailModalProps) {
  const agregar = useCartStore((s) => s.agregar)
  const enCarrito = useCartStore((s) => s.items)
  const inicial = producto.variantes.find((v) => v.sku === skuInicial)
  const colores = [...new Set(producto.variantes.map((v) => v.color))]
  const [color, setColor] = useState(inicial?.color ?? colores[0])
  const [talla, setTalla] = useState<string | null>(inicial?.talla ?? null)

  const tallas = producto.variantes.filter((v) => v.color === color)
  const variante = tallas.find((v) => v.talla === talla)
  const precio = variante?.precio ?? producto.precioBase
  const yaEnCarrito = enCarrito.find((i) => i.sku === variante?.sku)?.cantidad ?? 0
  const topeAlcanzado = !!variante && yaEnCarrito >= variante.stockTienda

  function agregarAlCarrito() {
    if (!variante) return
    const agregado = agregar({
      sku: variante.sku,
      productoId: producto.productoId,
      nombre: producto.nombre,
      categoria: producto.categoria,
      talla: variante.talla,
      color: variante.color,
      precioUnitario: precio,
      stockTienda: variante.stockTienda,
    })
    if (!agregado) return toast.warning('Stock máximo disponible en tienda alcanzado')
    toast.success(`${producto.nombre} (${variante.talla} · ${variante.color}) agregado al carrito`)
    onClose()
  }

  return (
    <Modal title={producto.nombre} size="lg" onClose={onClose}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <ProductImage categoria={producto.categoria} size={128} className="aspect-square w-full" />
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-text-secondary">
              {producto.marca} · {producto.disciplina}
            </p>
            <p className="text-2xl font-bold tabular-nums">{formatSoles(precio)}</p>
          </div>

          <div className="flex flex-col gap-2">
            <p id="selector-color" className="text-sm font-semibold">
              Color: <span className="font-normal">{color}</span>
            </p>
            <div role="radiogroup" aria-labelledby="selector-color" className="flex flex-wrap gap-2" onKeyDown={moverFoco}>
              {colores.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={c === color}
                  className={opcion(c === color)}
                  onClick={() => {
                    setColor(c)
                    if (!producto.variantes.some((v) => v.color === c && v.talla === talla)) setTalla(null)
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p id="selector-talla" className="text-sm font-semibold">
              Talla
            </p>
            <div role="radiogroup" aria-labelledby="selector-talla" className="grid grid-cols-4 gap-2" onKeyDown={moverFoco}>
              {tallas.map((v) => (
                <button
                  key={v.sku}
                  type="button"
                  role="radio"
                  aria-checked={v.talla === talla}
                  aria-label={v.stockTienda === 0 ? `Talla ${v.talla}, sin stock en tienda` : `Talla ${v.talla}`}
                  className={cx(opcion(v.talla === talla), v.stockTienda === 0 && v.talla !== talla && 'text-text-disabled line-through')}
                  onClick={() => setTalla(v.talla)}
                >
                  {v.talla}
                </button>
              ))}
            </div>
          </div>

          {variante ? (
            <div className="flex flex-col gap-2" aria-live="polite">
              <p className="text-sm text-text-secondary">
                SKU: <span className="font-semibold text-text-primary">{variante.sku}</span>
              </p>
              <div>
                <StockBadge stockTienda={variante.stockTienda} stockAlmacenCentral={variante.stockAlmacenCentral} />
              </div>
              {variante.stockTienda === 0 && variante.stockAlmacenCentral > 0 && (
                <Alert tono="info">No disponible para venta presencial inmediata. Disponible solo para pedido web/entrega programada</Alert>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">Elige una talla para ver su SKU y disponibilidad.</p>
          )}

          <Button
            size="lg"
            fullWidth
            icon={<IconShoppingCartPlus size={20} aria-hidden />}
            disabled={!variante || variante.stockTienda === 0 || topeAlcanzado}
            title={topeAlcanzado ? 'Stock máximo disponible en tienda alcanzado' : undefined}
            onClick={agregarAlCarrito}
          >
            Agregar para Venta Inmediata
          </Button>
        </div>
      </div>
    </Modal>
  )
}
