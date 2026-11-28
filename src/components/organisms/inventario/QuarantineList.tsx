import { IconShieldCheck } from '@tabler/icons-react'
import Badge from '../../atoms/Badge'
import Alert from '../../molecules/Alert'
import EmptyState from '../../molecules/EmptyState'
import { etiquetaFalla, type EstadoIncidencia, type ItemCuarentena } from '../../../api/inventarioApi'

type QuarantineListProps = {
  items: ItemCuarentena[]
  cargando?: boolean
  error?: string | null
}

const ESTADOS: Record<EstadoIncidencia, { etiqueta: string; tono: 'warning' | 'error' | 'neutral' }> = {
  PENDIENTE_REPORTE: { etiqueta: 'Pendiente de Inventario', tono: 'warning' },
  EN_CUARENTENA: { etiqueta: 'En cuarentena', tono: 'error' },
  DERIVADO_ALMACEN: { etiqueta: 'Derivado a almacén', tono: 'neutral' },
  BAJA_DEFINITIVA: { etiqueta: 'Baja definitiva', tono: 'neutral' },
}

const formatoFecha = new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Lima' })

/** Número corto de la incidencia para leerlo en voz alta en tienda. */
export const numeroCorto = (incidenciaId: string) => incidenciaId.slice(0, 8).toUpperCase()

/**
 * Bandeja de artículos en cuarentena de la tienda (F12 · RF-33, tarea F3; CA-RF33-03).
 * Cada fila muestra el número de incidencia, la prenda, el motivo de retención y su estado.
 */
export default function QuarantineList({ items, cargando = false, error = null }: QuarantineListProps) {
  if (error) {
    return (
      <Alert tono="error" title="No se pudo cargar la cuarentena">
        {error}
      </Alert>
    )
  }
  if (cargando && items.length === 0) {
    return (
      <p role="status" className="text-sm text-[var(--color-text-secondary)]">
        Cargando artículos en cuarentena…
      </p>
    )
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<IconShieldCheck size={24} />}
        title="No hay prendas en cuarentena"
        description="Cuando reportes una prenda dañada o no ubicada aparecerá aquí, bloqueada para la venta."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Artículos en cuarentena de la tienda</caption>
        <thead className="border-b border-[var(--color-border-default)] text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
          <tr>
            <th scope="col" className="px-3 py-2">Incidencia</th>
            <th scope="col" className="px-3 py-2">Prenda</th>
            <th scope="col" className="px-3 py-2">Motivo</th>
            <th scope="col" className="px-3 py-2">Reportada</th>
            <th scope="col" className="px-3 py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const estado = ESTADOS[item.estado]
            return (
              <tr key={item.incidenciaId} className="border-b border-[var(--color-border-default)] last:border-0">
                <td className="px-3 py-3 font-semibold tabular-nums">{numeroCorto(item.incidenciaId)}</td>
                <td className="px-3 py-3">
                  <p className="font-semibold text-[var(--color-text-primary)]">{item.nombreProducto ?? 'Prenda sin nombre'}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] tabular-nums">SKU {item.sku}</p>
                </td>
                <td className="px-3 py-3">{etiquetaFalla(item.tipoFalla)}</td>
                <td className="px-3 py-3 tabular-nums">{formatoFecha.format(new Date(item.fechaReporte))}</td>
                <td className="px-3 py-3">
                  <Badge tone={estado.tono}>{estado.etiqueta}</Badge>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
