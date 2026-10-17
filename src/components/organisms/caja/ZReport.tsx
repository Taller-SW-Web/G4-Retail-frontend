import Alert from '../../molecules/Alert'
import { TERMINAL_POS, type ReporteZResponse } from '../../../api/caja'
import { formatCurrency, formatFechaHora } from '../../../lib/format'

interface ZReportProps {
  reporte: ReporteZResponse
  cajero: string
  tiendaId: string
  fechaHora: string
  observaciones: string
}

/**
 * Resultado del arqueo ciego y ticket del Reporte Z (RF-22).
 *
 * Se muestra una sola vez, después de cerrar: es el único momento en que el cajero ve el saldo del
 * sistema. El bloque `.print-area` es lo único que sale por la impresora térmica de 80 mm, así que
 * la pantalla y el papel muestran exactamente lo mismo.
 */
export default function ZReport({ reporte, cajero, tiendaId, fechaHora, observaciones }: ZReportProps) {
  const { diferencia } = reporte
  const filas: [string, number][] = [
    ['Fondo fijo inicial', reporte.saldoInicial],
    ['Ventas en efectivo', reporte.ventasEfectivoTotal],
    ['Ingresos menores', reporte.ingresosMenores],
    ['Egresos menores', -reporte.egresosMenores],
  ]

  return (
    <article className="print-area mx-auto flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border-default bg-white p-6 text-xs shadow-md">
      <header className="flex flex-col items-center gap-1 text-center">
        <p className="font-heading text-sm font-bold italic">INKA ATHLETICS</p>
        <p className="text-sm font-bold">REPORTE Z — CIERRE DE TURNO</p>
        <p>
          {tiendaId} · {TERMINAL_POS} · Turno {reporte.turnoId}
        </p>
        <p>
          {formatFechaHora(fechaHora)} · Cajero: {cajero}
        </p>
      </header>

      {diferencia === 0 ? (
        <Alert tono="success" title={`Caja cuadrada con éxito (Diferencia ${formatCurrency(diferencia)})`} />
      ) : (
        <Alert tono="error" title={`${diferencia < 0 ? 'Faltante' : 'Sobrante'} de ${formatCurrency(Math.abs(diferencia))}`}>
          La sesión queda en estado {reporte.estado} para revisión del supervisor.
        </Alert>
      )}

      <dl className="flex flex-col gap-1 tabular-nums">
        {filas.map(([etiqueta, monto]) => (
          <div key={etiqueta} className="flex justify-between">
            <dt>{etiqueta}</dt>
            <dd>{formatCurrency(monto)}</dd>
          </div>
        ))}
        <div className="mt-1 flex justify-between border-t border-dashed border-text-secondary pt-2 text-sm font-bold">
          <dt>Total Esperado</dt>
          <dd>{formatCurrency(reporte.saldoSistema)}</dd>
        </div>
        <div className="flex justify-between text-sm font-bold">
          <dt>Total Efectivo Declarado</dt>
          <dd>{formatCurrency(reporte.saldoDeclarado)}</dd>
        </div>
        <div className="flex justify-between text-sm font-bold">
          <dt>Diferencia</dt>
          <dd>{formatCurrency(diferencia)}</dd>
        </div>
      </dl>

      {observaciones && <p>Observaciones: {observaciones}</p>}
    </article>
  )
}
