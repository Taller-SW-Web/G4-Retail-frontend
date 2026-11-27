import { IconPrinter } from '@tabler/icons-react'
import Button from '../../atoms/Button'
import type { ActaEmitida } from '../../../api/actasMermaApi'
import { ETIQUETA_FALLA, etiquetaDestino } from '../../../lib/actaMerma'
import { formatFechaHora } from '../../../lib/format'

interface ActaPrintPreviewProps {
  acta: ActaEmitida
  /** Nombre de cada prenda por `incidenciaId`, tomado de la bandeja. La respuesta solo trae el SKU. */
  nombres?: Record<string, string>
}

/**
 * Acta oficial de discrepancia o merma de tienda, lista para imprimir (F12 · RF-34, CA-RF34-03).
 *
 * Todo lo que se imprime sale de la respuesta del acta (contrato §5.12): Retail no genera PDF. Va en
 * A4 para adjuntarla al bulto, con las casillas de firma del supervisor y de quien recibe. Usa
 * `print-area`: al imprimir, solo sale el acta.
 */
export default function ActaPrintPreview({ acta, nombres = {} }: ActaPrintPreviewProps) {
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
            <p className="text-xs text-[var(--color-text-secondary)]">Emitida {formatFechaHora(acta.fechaEmision)}</p>
          </div>
        </header>

        <dl className="grid grid-cols-1 gap-x-6 gap-y-1 py-4 sm:grid-cols-2">
          <div className="flex gap-2">
            <dt className="font-semibold">Tienda:</dt>
            <dd>{acta.tiendaId}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">Supervisor:</dt>
            <dd>{acta.supervisor.nombre}</dd>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <dt className="font-semibold">Destino:</dt>
            <dd>{etiquetaDestino(acta.tipoDestino)}</dd>
          </div>
        </dl>

        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-y border-[var(--color-border-default)] uppercase">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">SKU</th>
              <th className="py-2 pr-2">Motivo</th>
              <th className="py-2 pr-2">Detalle</th>
              <th className="py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {acta.incidencias.map((prenda, indice) => (
              <tr key={prenda.incidenciaId} className="border-b border-[var(--color-border-default)] align-top">
                <td className="py-2 pr-2">{indice + 1}</td>
                <td className="py-2 pr-2">
                  <span className="font-mono">{prenda.sku}</span>
                  {nombres[prenda.incidenciaId] && (
                    <span className="block text-[var(--color-text-secondary)]">{nombres[prenda.incidenciaId]}</span>
                  )}
                </td>
                <td className="py-2 pr-2">{ETIQUETA_FALLA[prenda.tipoFalla]}</td>
                <td className="py-2 pr-2">{prenda.detalleObservacion}</td>
                <td className="py-2 font-mono">{prenda.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="pt-3 text-right font-semibold">Total de prendas: {acta.totalPrendas}</p>

        {acta.observaciones && (
          <p className="pt-2">
            <span className="font-semibold">Observaciones: </span>
            {acta.observaciones}
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
            {acta.supervisor.nombre}
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
