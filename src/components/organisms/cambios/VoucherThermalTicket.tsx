import { QRCodeSVG } from 'qrcode.react'
import type { ValeCompra } from '../../../api/cambiosApi'
import { formatCurrency, formatFecha, formatFechaHora } from '../../../lib/format'

interface VoucherThermalTicketProps {
  vale: ValeCompra
}

/**
 * Vale de compra en formato de ticket térmico de 80 mm (F9 · RF-25).
 *
 * Usa la clase `print-area`: al imprimir, solo sale este ticket. El código escaneable lleva el
 * código del vale, para canjearlo en caja con el mismo lector que se usa para los productos.
 */
export default function VoucherThermalTicket({ vale }: VoucherThermalTicketProps) {
  return (
    <article
      aria-label={`Vale de compra ${vale.codigoVale}`}
      className="print-area mx-auto w-full max-w-[80mm] rounded-xl border border-dashed border-[var(--color-border-default)] bg-white p-4 font-mono text-xs text-[var(--color-text-primary)]"
    >
      <header className="border-b border-dashed border-[var(--color-border-default)] pb-2 text-center">
        <p className="font-heading text-base font-bold uppercase tracking-wider">Inka Athletics</p>
        <p className="text-[10px] uppercase text-[var(--color-text-secondary)]">Tienda Miraflores · Retail</p>
        <p className="mt-2 text-sm font-bold uppercase">Vale de compra</p>
      </header>

      <div className="py-3 text-center">
        <p className="text-lg font-bold tracking-wider">{vale.codigoVale}</p>
        <p className="mt-1 text-2xl font-bold">{formatCurrency(vale.monto)}</p>
        <p className="text-[10px] uppercase text-[var(--color-text-secondary)]">Saldo a favor</p>
      </div>

      <dl className="space-y-1 border-y border-dashed border-[var(--color-border-default)] py-2">
        <div className="flex justify-between gap-2">
          <dt>Boleta de origen</dt>
          <dd className="font-bold">{vale.boletaOrigen}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Emitido</dt>
          <dd>{formatFechaHora(vale.fechaEmision)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Vence</dt>
          <dd className="font-bold">{formatFecha(vale.fechaVencimiento)}</dd>
        </div>
      </dl>

      <div className="flex justify-center py-3">
        <QRCodeSVG size={96} value={vale.codigoBarras} aria-label="Código escaneable del vale" />
      </div>

      <p className="text-center text-[10px] leading-snug text-[var(--color-text-secondary)]">
        Válido solo en tiendas físicas Inka Athletics hasta la fecha de vencimiento. No canjeable por
        dinero en efectivo.
      </p>
    </article>
  )
}
