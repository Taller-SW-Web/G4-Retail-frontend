import { useEffect, useId, useState } from 'react'
import { IconAlertOctagon, IconAlertTriangle, IconBuildingWarehouse, IconCheck, IconChevronDown, IconCopy } from '@tabler/icons-react'
import Badge from '../../atoms/Badge'
import EmptyState from '../../molecules/EmptyState'
import type { VarianteCritica } from '../../../api/controlApi'

interface CriticalStockWidgetProps {
  variantes: VarianteCritica[]
  /** Abierto por defecto: dentro de la torre de control es lo primero que se mira. */
  abiertoInicial?: boolean
}

/** Texto del almacén central: con cantidad si Productos la expone, solo el estado si no (X-P0-03). */
export function textoCentral(variante: VarianteCritica): string {
  if (variante.stockCentral != null) {
    return variante.stockCentral > 0
      ? `Central: ${variante.stockCentral} ${variante.stockCentral === 1 ? 'disponible' : 'disponibles'}`
      : 'Central: sin unidades'
  }
  if (variante.disponibleEnCentral === true) return 'Central: con unidades disponibles'
  if (variante.disponibleEnCentral === false) return 'Central: sin unidades'
  return 'Central: sin dato de Productos'
}

/** Semáforo de la variante. El estado va siempre con texto e icono, nunca solo con color. */
function Semaforo({ variante }: { variante: VarianteCritica }) {
  if (variante.nivel === 'AGOTADO') {
    return (
      <Badge tone="error">
        <span className="relative mr-1.5 flex size-2" aria-hidden="true">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--color-error)] opacity-75 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2 rounded-full bg-[var(--color-error)]" />
        </span>
        <IconAlertOctagon size={14} aria-hidden="true" className="mr-1" />
        Agotado en tienda
      </Badge>
    )
  }
  return (
    <Badge tone="warning">
      <IconAlertTriangle size={14} aria-hidden="true" className="mr-1" />
      {variante.stockTienda != null
        ? `${variante.stockTienda === 1 ? 'Queda 1 unidad' : `Quedan ${variante.stockTienda} unidades`}`
        : 'Últimas unidades'}
    </Badge>
  )
}

/**
 * F11 · RF-29: semáforo de stock de la tienda.
 *
 * Rojo parpadeante para las variantes agotadas en tienda y ámbar para las últimas unidades, con lo
 * que hay en el almacén central para orientar la venta asistida. Si Productos no expone cantidades,
 * muestra solo el semáforo. El SKU se copia con un clic para buscarlo en otra sede o en el catálogo.
 */
export default function CriticalStockWidget({ variantes, abiertoInicial = true }: CriticalStockWidgetProps) {
  const [abierto, setAbierto] = useState(abiertoInicial)
  const [copiado, setCopiado] = useState<string | null>(null)
  const panelId = useId()
  const agotados = variantes.filter((v) => v.nivel === 'AGOTADO').length

  useEffect(() => {
    if (!copiado) return
    const temporizador = setTimeout(() => setCopiado(null), 2000)
    return () => clearTimeout(temporizador)
  }, [copiado])

  const copiar = async (sku: string) => {
    try {
      await navigator.clipboard.writeText(sku)
      setCopiado(sku)
    } catch {
      // Sin permiso de portapapeles el SKU sigue visible para copiarlo a mano.
    }
  }

  return (
    <section className="rounded-xl border border-[var(--color-border-default)] bg-white">
      <button
        type="button"
        aria-expanded={abierto}
        aria-controls={panelId}
        onClick={() => setAbierto((valor) => !valor)}
        className="flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-signal)]"
      >
        <span className="flex flex-col">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">Semáforo de stock de tienda</span>
          <span className="text-xs text-[var(--color-text-secondary)]">
            {variantes.length === 0
              ? 'Sin alertas'
              : `${agotados} ${agotados === 1 ? 'agotada' : 'agotadas'} · ${variantes.length - agotados} en últimas unidades`}
          </span>
        </span>
        <IconChevronDown
          size={20}
          aria-hidden="true"
          className={`shrink-0 transition-transform ${abierto ? 'rotate-180' : ''}`}
        />
      </button>

      <div id={panelId} hidden={!abierto} className="border-t border-[var(--color-border-default)] p-3">
        {variantes.length === 0 ? (
          <EmptyState
            icon={<IconCheck size={24} />}
            title="Stock en orden"
            description="Ninguna variante está agotada ni en sus últimas unidades en esta tienda."
          />
        ) : (
          <ul className="flex flex-col gap-2" aria-label="Variantes con stock crítico">
            {variantes.map((variante) => (
              <li
                key={variante.sku}
                data-nivel={variante.nivel}
                className="flex flex-col gap-2 rounded-lg border border-[var(--color-border-default)] p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{variante.nombreProducto}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {[variante.talla && `Talla ${variante.talla}`, variante.color].filter(Boolean).join(' · ') || 'Variante única'}
                    </p>
                  </div>
                  <Semaforo variante={variante} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                    <IconBuildingWarehouse size={16} aria-hidden="true" />
                    {textoCentral(variante)}
                  </span>
                  <button
                    type="button"
                    onClick={() => void copiar(variante.sku)}
                    aria-label={`Copiar SKU ${variante.sku}`}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-mono font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-cloud-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-signal)]"
                  >
                    {copiado === variante.sku ? (
                      <IconCheck size={16} aria-hidden="true" className="text-[var(--color-success)]" />
                    ) : (
                      <IconCopy size={16} aria-hidden="true" />
                    )}
                    {variante.sku}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p role="status" className="sr-only">
          {copiado ? `SKU ${copiado} copiado` : ''}
        </p>
      </div>
    </section>
  )
}
