import { useState } from 'react'
import { IconBolt, IconCircleCheck, IconInfoCircle, IconTag, IconX } from '@tabler/icons-react'
import { esVigente, type CampanaVigente } from '../../api/controlApi'
import { useCartStore } from '../../store/cart'
import { formatCurrency, formatFecha } from '../../lib/format'

interface PromoBannerProps {
  campanas: CampanaVigente[]
  /** Momento de referencia para descartar campañas vencidas; en pruebas se fija. */
  ahora?: Date
}

/** Descuento en el formato del sistema de diseño: `- 30 %`, `- S/ 20.00` o `2x1`. */
export function etiquetaDescuento(campana: CampanaVigente): string | null {
  if (campana.valor == null) return null
  if (campana.tipoDescuento === 'PORCENTAJE') return `- ${campana.valor} %`
  if (campana.tipoDescuento === 'MONTO_FIJO') return `- ${formatCurrency(campana.valor)}`
  return null
}

/**
 * F11 · RF-31: tira de promociones del día en el POS.
 *
 * Cada chip es una campaña vigente del canal RETAIL. Si trae cupón, un clic lo deja aplicado en el
 * carrito (RF-11) sin que el vendedor lo teclee. "Ver condiciones" despliega las restricciones y el
 * monto mínimo. Las campañas vencidas no se muestran aunque lleguen en la respuesta.
 */
export default function PromoBanner({ campanas, ahora }: PromoBannerProps) {
  const cuponActual = useCartStore((s) => s.cupon)
  const aplicarCupon = useCartStore((s) => s.aplicarCupon)
  const [detalle, setDetalle] = useState<string | null>(null)
  const [aviso, setAviso] = useState('')

  const vigentes = campanas.filter((campana) => esVigente(campana, ahora))
  if (vigentes.length === 0) return null

  const inyectar = (campana: CampanaVigente) => {
    if (!campana.codigoCupon) return
    aplicarCupon(campana.codigoCupon)
    setAviso(`Cupón ${campana.codigoCupon} aplicado al carrito`)
  }

  const abierta = vigentes.find((c) => c.campanaId === detalle)

  return (
    <section
      aria-label="Promociones del día en mostrador"
      className="rounded-2xl border border-[var(--color-border-default)] bg-white p-3 shadow-sm"
    >
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <p className="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
          <IconBolt size={16} aria-hidden="true" className="text-[var(--color-action-primary)]" />
          Promociones del día
        </p>
        <ul className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
          {vigentes.map((campana) => {
            const descuento = etiquetaDescuento(campana)
            const aplicado = !!campana.codigoCupon && cuponActual === campana.codigoCupon
            return (
              <li key={campana.campanaId} className="flex shrink-0 items-center rounded-full bg-[var(--color-accent-volt)] text-[var(--color-text-primary)]">
                <button
                  type="button"
                  onClick={() => inyectar(campana)}
                  disabled={!campana.codigoCupon}
                  aria-label={
                    campana.codigoCupon
                      ? `Aplicar cupón ${campana.codigoCupon}: ${campana.titulo}`
                      : `${campana.titulo} (se aplica sin cupón)`
                  }
                  aria-pressed={campana.codigoCupon ? aplicado : undefined}
                  className="flex items-center gap-2 rounded-l-full py-1.5 pl-3 pr-2 text-sm font-semibold hover:bg-[var(--color-accent-volt-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-signal)] disabled:cursor-default disabled:hover:bg-transparent"
                >
                  {aplicado ? <IconCircleCheck size={16} aria-hidden="true" /> : <IconTag size={16} aria-hidden="true" />}
                  <span>{campana.titulo}</span>
                  {descuento && <span className="tabular-nums">{descuento}</span>}
                  {campana.codigoCupon && (
                    <span className="rounded-full bg-[var(--color-surface-ink)] px-2 py-0.5 font-mono text-xs text-[var(--color-text-inverse)]">
                      {campana.codigoCupon}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setDetalle(detalle === campana.campanaId ? null : campana.campanaId)}
                  aria-expanded={detalle === campana.campanaId}
                  aria-label={`Ver condiciones de ${campana.titulo}`}
                  className="rounded-r-full border-l border-[var(--color-surface-ink)]/20 py-1.5 pl-2 pr-3 hover:bg-[var(--color-accent-volt-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-signal)]"
                >
                  <IconInfoCircle size={16} aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {abierta && (
        <div
          role="region"
          aria-label={`Condiciones de ${abierta.titulo}`}
          className="mt-3 flex items-start justify-between gap-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-cloud)] p-3 text-sm"
        >
          <dl className="grid gap-1 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-4">
            {abierta.descripcion && (
              <>
                <dt className="font-semibold">Promoción</dt>
                <dd>{abierta.descripcion}</dd>
              </>
            )}
            <dt className="font-semibold">Condiciones</dt>
            <dd>{abierta.condiciones ?? 'Sin restricciones publicadas por Productos.'}</dd>
            <dt className="font-semibold">Monto mínimo</dt>
            <dd>{abierta.montoMinimo != null ? formatCurrency(abierta.montoMinimo) : 'Sin monto mínimo'}</dd>
            <dt className="font-semibold">Vigencia</dt>
            <dd>
              Del {formatFecha(abierta.vigenteDesde)} al {formatFecha(abierta.vigenteHasta)}
            </dd>
          </dl>
          <button
            type="button"
            onClick={() => setDetalle(null)}
            aria-label="Cerrar condiciones"
            className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-cloud-subtle)]"
          >
            <IconX size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      <p role="status" className="sr-only">
        {aviso}
      </p>
    </section>
  )
}
