import { useState } from 'react'
import { IconDiscount2, IconX } from '@tabler/icons-react'
import Button from '../../atoms/Button'
import { formatCurrency } from '../../../lib/format'
import { useCartStore } from '../../../store/cart'
import type { TotalesCarrito } from '../../../types'

interface TotalsPanelProps {
  totales: TotalesCarrito
}

/**
 * Resumen financiero y desglose tributario SUNAT del carrito (RF-11, RF-12).
 * Muestra Subtotal, Descuentos, Base Gravada, IGV (18%) y Total oficial.
 */
export default function TotalsPanel({ totales }: TotalsPanelProps) {
  const cupon = useCartStore((s) => s.cupon)
  const aplicarCupon = useCartStore((s) => s.aplicarCupon)

  const [inputCupon, setInputCupon] = useState('')
  const [errorCupon, setErrorCupon] = useState(false)

  const handleAplicar = (e: React.FormEvent) => {
    e.preventDefault()
    const codigo = inputCupon.trim().toUpperCase()
    if (!codigo) return

    if (codigo === 'VERANO2026' || codigo === 'DESCUENTO10') {
      aplicarCupon(codigo)
      setInputCupon('')
      setErrorCupon(false)
    } else {
      setErrorCupon(true)
    }
  }

  const handleRemoverCupon = () => {
    aplicarCupon('')
    setErrorCupon(false)
  }

  return (
    <div className="space-y-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-cloud-subtle)] p-3">
      {/* Sección Cupones */}
      <div className="border-b border-[var(--color-border-default)] pb-2">
        <label htmlFor="input-cupon" className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase text-[var(--color-text-secondary)]">
          <IconDiscount2 size={16} className="text-[var(--color-accent-signal)]" />
          Cupón de descuento
        </label>

        {cupon ? (
          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-1.5">
            <span className="text-xs font-semibold text-green-800">
              {cupon} (-10%)
            </span>
            <button
              type="button"
              onClick={handleRemoverCupon}
              className="text-green-700 hover:text-green-900"
              aria-label="Remover cupón"
            >
              <IconX size={16} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleAplicar} className="flex gap-2">
            <input
              id="input-cupon"
              type="text"
              value={inputCupon}
              onChange={(e) => {
                setInputCupon(e.target.value.toUpperCase())
                setErrorCupon(false)
              }}
              placeholder="Ej. VERANO2026"
              className="flex-1 rounded-lg border border-[var(--color-border-default)] bg-white px-3 py-1.5 text-xs uppercase text-[var(--color-text-primary)] focus:border-[var(--color-action-primary)] focus:outline-none"
            />
            <Button type="submit" variant="secondary" className="px-3 py-1.5 text-xs">
              Aplicar
            </Button>
          </form>
        )}

        {errorCupon && (
          <p className="mt-1 text-xs text-red-600">
            Cupón no válido o vencido.
          </p>
        )}
      </div>

      {/* Desglose Tributario SUNAT */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-[var(--color-text-secondary)]">
          <span>Subtotal Bruto</span>
          <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">
            {formatCurrency(totales.subtotalBruto)}
          </span>
        </div>

        {totales.descuentoTotal > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Descuentos</span>
            <span className="font-semibold tabular-nums">
              - {formatCurrency(totales.descuentoTotal)}
            </span>
          </div>
        )}

        <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
          <span>Operación Gravada</span>
          <span className="tabular-nums">{formatCurrency(totales.baseImponible)}</span>
        </div>

        <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
          <span>IGV Incluido (18%)</span>
          <span className="tabular-nums">{formatCurrency(totales.montoIgv)}</span>
        </div>

        <div className="border-t border-[var(--color-border-default)] pt-2.5">
          <div className="flex items-baseline justify-between">
            <span className="font-heading text-lg uppercase tracking-wide text-[var(--color-text-primary)]">
              Total a Pagar
            </span>
            <span className="font-heading text-2xl font-bold tabular-nums text-[var(--color-text-primary)]">
              {formatCurrency(totales.totalPagar)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
