import type { CambioRegistrado } from '../../../api/cambiosApi'
import { formatCurrency, formatFechaHora } from '../../../lib/format'

interface ConstanciaCambioTicketProps {
  cambio: CambioRegistrado
}

/**
 * Constancia del cambio directo en ticket térmico de 80 mm (F9 · RF-25, contrato §5.9).
 *
 * Se imprime en los dos tipos de cambio y referencia la boleta original. En mayor valor muestra
 * además la boleta nueva y el pago de la diferencia. Usa `print-area`: al imprimir, solo sale esto.
 */
export default function ConstanciaCambioTicket({ cambio }: ConstanciaCambioTicketProps) {
  const fila = 'flex justify-between gap-2'
  return (
    <article
      aria-label={`Constancia ${cambio.numeroConstancia}`}
      className="print-area mx-auto w-full max-w-[80mm] rounded-xl border border-dashed border-[var(--color-border-default)] bg-white p-4 font-mono text-xs text-[var(--color-text-primary)]"
    >
      <header className="border-b border-dashed border-[var(--color-border-default)] pb-2 text-center">
        <p className="font-heading text-base font-bold uppercase tracking-wider">Inka Athletics</p>
        <p className="mt-1 text-sm font-bold uppercase">Constancia de cambio</p>
        <p className="text-sm font-bold">{cambio.numeroConstancia}</p>
        <p className="text-[10px] text-[var(--color-text-secondary)]">{formatFechaHora(cambio.fechaCambio)}</p>
      </header>

      <dl className="space-y-1 border-b border-dashed border-[var(--color-border-default)] py-2">
        <div className={fila}>
          <dt>Boleta original</dt>
          <dd className="font-bold">{cambio.boletaOrigen}</dd>
        </div>
        <div className={fila}>
          <dt>Devuelve</dt>
          <dd>
            {cambio.devuelto.cantidad} × {cambio.devuelto.sku}
          </dd>
        </div>
        {cambio.nuevos.map((prenda) => (
          <div key={prenda.sku} className={fila}>
            <dt>Se lleva</dt>
            <dd>
              {prenda.cantidad} × {prenda.sku}
            </dd>
          </div>
        ))}
      </dl>

      <dl className="space-y-1 py-2">
        <div className={fila}>
          <dt>Crédito</dt>
          <dd>{formatCurrency(cambio.montoCredito)}</dd>
        </div>
        <div className={fila}>
          <dt>Total prendas nuevas</dt>
          <dd>{formatCurrency(cambio.totalNuevo)}</dd>
        </div>
        <div className={`${fila} font-bold`}>
          <dt>Diferencia cobrada</dt>
          <dd>{formatCurrency(cambio.diferencia)}</dd>
        </div>
        {cambio.pago && (
          <div className={fila}>
            <dt>{cambio.pago.medioPago === 'EFECTIVO' ? 'Efectivo · vuelto' : 'Tarjeta'}</dt>
            <dd>
              {formatCurrency(cambio.pago.montoRecibido)}
              {cambio.pago.medioPago === 'EFECTIVO' && ` · ${formatCurrency(cambio.pago.vuelto)}`}
            </dd>
          </div>
        )}
        {cambio.comprobante && (
          <div className={fila}>
            <dt>Boleta nueva</dt>
            <dd className="font-bold">
              {cambio.comprobante.serie}-{cambio.comprobante.correlativo}
            </dd>
          </div>
        )}
      </dl>

      <footer className="border-t border-dashed border-[var(--color-border-default)] pt-2 text-center text-[10px] uppercase text-[var(--color-text-secondary)]">
        {cambio.tipoCambio === 'MISMO_VALOR' ? 'Cambio de igual valor · sin cobro' : 'Cambio de mayor valor'}
      </footer>
    </article>
  )
}
