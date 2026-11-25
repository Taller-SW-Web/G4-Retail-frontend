import { IconPrinter } from '@tabler/icons-react'
import Button from '../../atoms/Button'
import type { ActaEmitida, IncidenciaCuarentena, TipoDestino } from '../../../api/actasMermaApi'
import { ETIQUETA_FALLA, etiquetaDestino } from '../../../lib/actaMerma'
import { formatFecha, formatFechaHora } from '../../../lib/format'

interface ActaPrintPreviewProps {
  acta: ActaEmitida
  /** Prendas incluidas en el acta, con el detalle que se imprime. */
  prendas: IncidenciaCuarentena[]
  tipoDestino: TipoDestino
  observaciones?: string
  /** Código del supervisor que emite el acta, por ejemplo `SUP-001`. */
  supervisor: string
  tiendaId: string
  /** Hora de emisión si la respuesta no la trae. */
  emitidaEn: string
}

/**
 * Acta oficial de discrepancia o merma de tienda, lista para imprimir (F12 · RF-34, CA-RF34-03).
 *
 * Se imprime en A4 para adjuntarla al bulto que sale hacia el almacén central, con las casillas de
 * firma del supervisor y de quien recibe. Usa `print-area`: al imprimir, solo sale el acta.
 */
export default function ActaPrintPreview({
  acta,
  prendas,
  tipoDestino,
  observaciones,
  supervisor,
  tiendaId,
  emitidaEn,
}: ActaPrintPreviewProps) {
  return (
    <div className="flex flex-col gap-4">
      <article
        aria-label={`Acta ${acta.actaNumero}`}
        className="print-area print-a4 rounded-xl border border-[var(--color-border-default)] bg-white p-6 text-sm text-[var(--color-text-primary)]"
      >
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-border-default)] pb-4">
          <div>
            <p className="font-heading text-lg font-bold uppercase tracking-wider">Inka Athletics · Retail</p>
            <h2 className="text-base font-bold uppercase">Acta de discrepancia y merma de tienda</h2>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg font-bold">{acta.actaNumero}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Emitida {formatFechaHora(acta.fechaEmision ?? emitidaEn)}
            </p>
          </div>
        </header>

        <dl className="grid grid-cols-1 gap-x-6 gap-y-1 py-4 sm:grid-cols-2">
          <div className="flex gap-2">
            <dt className="font-semibold">Tienda:</dt>
            <dd>{tiendaId}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">Supervisor:</dt>
            <dd>{supervisor}</dd>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <dt className="font-semibold">Destino:</dt>
            <dd>{etiquetaDestino(tipoDestino)}</dd>
          </div>
        </dl>

        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-y border-[var(--color-border-default)] uppercase">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">SKU</th>
              <th className="py-2 pr-2">Prenda</th>
              <th className="py-2 pr-2">Motivo</th>
              <th className="py-2">Reportada</th>
            </tr>
          </thead>
          <tbody>
            {prendas.map((prenda, indice) => (
              <tr key={prenda.incidenciaId} className="border-b border-[var(--color-border-default)]">
                <td className="py-2 pr-2">{indice + 1}</td>
                <td className="py-2 pr-2 font-mono">{prenda.sku}</td>
                <td className="py-2 pr-2">{prenda.nombreProducto}</td>
                <td className="py-2 pr-2">{ETIQUETA_FALLA[prenda.tipoFalla]}</td>
                <td className="py-2">{formatFecha(prenda.fechaReporte)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="pt-3 text-right font-semibold">Total de prendas: {acta.totalPrendas}</p>

        {observaciones && (
          <p className="pt-2">
            <span className="font-semibold">Observaciones: </span>
            {observaciones}
          </p>
        )}

        <p className="pt-4 text-xs text-[var(--color-text-secondary)]">
          El acta documenta la salida de las prendas de la tienda. Inventario resuelve cada incidencia y
          registra su recepción en el almacén central.
        </p>

        <footer className="grid grid-cols-2 gap-10 pt-16 text-center text-xs">
          <div className="border-t border-[var(--color-text-primary)] pt-2">
            Firma del supervisor de tienda
            <br />
            {supervisor}
          </div>
          <div className="border-t border-[var(--color-text-primary)] pt-2">
            Firma de quien recibe en almacén central
            <br />
            Nombre y DNI
          </div>
        </footer>
      </article>

      <Button onClick={() => window.print()} className="gap-2 self-end">
        <IconPrinter size={18} /> Imprimir acta
      </Button>
    </div>
  )
}
