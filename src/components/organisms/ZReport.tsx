import { Logo } from '../atoms/Logo'
import { Alert } from '../molecules/Alert'
import { TERMINAL_POS } from '../../services'
import { TIENDAS } from '../../lib/empresa'
import { formatFechaHora, formatSoles } from '../../lib/format'
import type { CierreCajaResponse } from '../../types'

interface ZReportProps {
  cierre: CierreCajaResponse
  cajero: string
  tiendaId: string
  fechaHora: string
  observaciones: string
}

/** RF-22: resultado del arqueo ciego y ticket del Reporte Z. */
export function ZReport({ cierre, cajero, tiendaId, fechaHora, observaciones }: ZReportProps) {
  const { diferencia } = cierre
  const filas: [string, number][] = [
    ['Fondo fijo inicial', cierre.saldoInicial],
    ['Ventas en efectivo', cierre.ventasEfectivoTotal],
    ['Ingresos menores', cierre.ingresosMenores],
    ['Egresos menores', -cierre.egresosMenores || 0],
  ]
  return (
    <article className="print-area mx-auto flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border-default bg-white p-6 text-xs shadow-md">
      <header className="flex flex-col items-center gap-1 text-center">
        <Logo />
        <p className="text-sm font-bold">REPORTE Z — CIERRE DE TURNO</p>
        <p>
          {TIENDAS[tiendaId]?.nombre ?? tiendaId} · {TERMINAL_POS} · Sesión {cierre.sesionId}
        </p>
        <p>
          {formatFechaHora(fechaHora)} · Cajero: {cajero}
        </p>
      </header>

      {diferencia === 0 ? (
        <Alert tono="success" title="Caja cuadrada con éxito (Diferencia S/ 0.00)" />
      ) : (
        <Alert tono="error" title={`${diferencia < 0 ? 'Faltante' : 'Sobrante'} de ${formatSoles(Math.abs(diferencia))}`}>
          La sesión queda en estado {cierre.estado} para revisión del supervisor.
        </Alert>
      )}

      <dl className="flex flex-col gap-1 tabular-nums">
        {filas.map(([etiqueta, monto]) => (
          <div key={etiqueta} className="flex justify-between">
            <dt>{etiqueta}</dt>
            <dd>{formatSoles(monto)}</dd>
          </div>
        ))}
        <div className="mt-1 flex justify-between border-t border-dashed border-text-secondary pt-2 text-sm font-bold">
          <dt>Total Esperado</dt>
          <dd>{formatSoles(cierre.saldoSistema)}</dd>
        </div>
        <div className="flex justify-between text-sm font-bold">
          <dt>Total Efectivo Declarado</dt>
          <dd>{formatSoles(cierre.saldoDeclarado)}</dd>
        </div>
        <div className="flex justify-between text-sm font-bold">
          <dt>Diferencia</dt>
          <dd>{formatSoles(diferencia)}</dd>
        </div>
        <div className="mt-1 flex justify-between border-t border-dashed border-text-secondary pt-2">
          <dt>Ventas con tarjeta (vouchers POS)</dt>
          <dd>{formatSoles(cierre.ventasTarjetaTotal)}</dd>
        </div>
      </dl>
      {observaciones && <p>Observaciones: {observaciones}</p>}
    </article>
  )
}
