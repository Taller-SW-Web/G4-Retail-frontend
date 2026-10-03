import { SummaryRow } from '../molecules/SummaryRow'
import { formatSoles } from '../../lib/format'
import type { Totales } from '../../lib/totals'

/** RF-12: desglose de subtotal, descuentos, base gravada, IGV y total a pagar. */
export function TotalsPanel({ totales }: { totales: Totales }) {
  return (
    <dl className="flex flex-col gap-1 rounded-lg bg-surface-cloud-subtle p-4">
      <SummaryRow label="Subtotal Bruto:" value={formatSoles(totales.subtotalBruto)} />
      <SummaryRow label="Descuentos Aplicados:" value={`- ${formatSoles(totales.descuentos)}`} tone="success" />
      <SummaryRow label="Base Gravada:" value={formatSoles(totales.baseGravada)} />
      <SummaryRow label="IGV Incluido (18 %):" value={formatSoles(totales.igv)} />
      <div className="mt-1 border-t border-border-default pt-2">
        <SummaryRow label="TOTAL A PAGAR:" value={formatSoles(totales.total)} tone="total" />
      </div>
    </dl>
  )
}
