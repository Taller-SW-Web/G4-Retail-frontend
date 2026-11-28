import { useState } from 'react'
import { IconDiscount2, IconX } from '@tabler/icons-react'
import Button from '../../atoms/Button'
import Alert from '../../molecules/Alert'
import { formatCurrency } from '../../../lib/format'
import { useCartStore } from '../../../store/cart'
import type { ResultadoTotales } from '../../../hooks/useTotalesCarrito'

interface TotalsPanelProps {
  resultado: ResultadoTotales
}

/**
 * Resumen financiero y desglose tributario SUNAT del carrito (RF-11, RF-12).
 *
 * Los montos y los descuentos vienen de `POST /carritos/calcular` (§5.4): el cupón lo valida Retail
 * con Productos (G6). Un cupón inválido no bloquea la venta: se avisa y no se descuenta.
 */
export default function TotalsPanel({ resultado }: TotalsPanelProps) {
  const { totales, promociones, cuponInvalido, bloqueoCuarentena, estimado, calculando } = resultado
  const cupon = useCartStore((s) => s.cupon)
  const aplicarCupon = useCartStore((s) => s.aplicarCupon)

  const [inputCupon, setInputCupon] = useState('')

  const handleAplicar = (e: React.FormEvent) => {
    e.preventDefault()
    const codigo = inputCupon.trim().toUpperCase()
    if (!codigo) return
    aplicarCupon(codigo)
    setInputCupon('')
  }

  const cuponAplicado = !!cupon && !cuponInvalido && !estimado && totales.descuentoTotal > 0

  return (
    <div className="space-y-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-cloud-subtle)] p-3">
      {/* Sección Cupones */}
      <div className="border-b border-[var(--color-border-default)] pb-2">
        <label htmlFor="input-cupon" className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase text-[var(--color-text-secondary)]">
          <IconDiscount2 size={16} className="text-[var(--color-accent-signal)]" />
          Cupón de descuento
        </label>

        {cupon ? (
          <div
            className={`flex items-center justify-between rounded-lg border px-3 py-1.5 ${
              cuponAplicado
                ? 'border-[var(--color-success)] bg-[var(--color-success-bg)]'
                : 'border-[var(--color-border-default)] bg-white'
            }`}
          >
            <span className="text-xs font-semibold text-[var(--color-text-primary)]">
              {cuponAplicado ? `Cupón ${cupon} aplicado` : cupon}
              {cuponAplicado && ` (- ${formatCurrency(totales.descuentoTotal)})`}
              {calculando && ' · validando…'}
            </span>
            <button
              type="button"
              onClick={() => aplicarCupon('')}
              className="rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-signal)]"
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
              onChange={(e) => setInputCupon(e.target.value.toUpperCase())}
              placeholder="Código del cupón"
              className="flex-1 rounded-lg border border-[var(--color-border-default)] bg-white px-3 py-1.5 text-xs uppercase text-[var(--color-text-primary)] focus:border-[var(--color-action-primary)] focus:outline-none"
            />
            <Button type="submit" variant="secondary" className="px-3 py-1.5 text-xs">
              Aplicar
            </Button>
          </form>
        )}

        {cupon && cuponInvalido && (
          <p className="mt-1 text-xs text-[var(--color-error)]">
            Cupón no válido o vencido: no se aplicó. La venta puede continuar.
          </p>
        )}
        {cupon && estimado && !calculando && (
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            Sin conexión con el servidor: el cupón se validará al cobrar.
          </p>
        )}
      </div>

      {bloqueoCuarentena && (
        <Alert tono="error" title="Prenda en cuarentena">{bloqueoCuarentena}</Alert>
      )}

      {/* Desglose Tributario SUNAT */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-[var(--color-text-secondary)]">
          <span>Subtotal Bruto</span>
          <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">
            {formatCurrency(totales.subtotalBruto)}
          </span>
        </div>

        {totales.descuentoTotal > 0 && (
          <div className="flex justify-between text-[var(--color-success)]">
            <span>Descuentos</span>
            <span className="font-semibold tabular-nums">
              - {formatCurrency(totales.descuentoTotal)}
            </span>
          </div>
        )}
        {promociones.map((promocion) => (
          <p key={promocion} className="text-xs text-[var(--color-success)]">{promocion}</p>
        ))}

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
          {estimado && (
            <p className="mt-1 text-right text-xs text-[var(--color-text-secondary)]">
              {calculando ? 'Calculando con precios vigentes…' : 'Total estimado sin descuentos'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
