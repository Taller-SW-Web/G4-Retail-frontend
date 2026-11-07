import { IconCheck, IconClock, IconX } from '@tabler/icons-react'
import type { EventoEstado } from '../../../api/pedidoApi'
import { etiquetaEstado, formatFechaHoraLima, pasosLineaTiempo, tonoEstado, type PasoLinea } from '../../../lib/pedidos'

const textoSituacion: Record<PasoLinea['situacion'], string> = {
  completado: 'completado',
  actual: 'en curso',
  pendiente: 'pendiente',
  anulado: 'anulado',
}

function claseNodo(paso: PasoLinea): string {
  switch (paso.situacion) {
    case 'completado':
      return 'bg-[var(--color-success)] text-white'
    case 'actual':
      return tonoEstado(paso.estado) === 'warning'
        ? 'bg-[var(--color-warning)] text-white ring-4 ring-[var(--color-warning-bg)]'
        : 'bg-[var(--color-info)] text-white ring-4 ring-[var(--color-info-bg)]'
    case 'anulado':
      return 'bg-[var(--color-error)] text-white ring-4 ring-[var(--color-error-bg)]'
    default:
      return 'border-2 border-[var(--color-border-default)] bg-white text-[var(--color-text-disabled)]'
  }
}

function claseTramo(siguiente: PasoLinea): string {
  if (siguiente.situacion === 'pendiente') return 'bg-[var(--color-border-default)]'
  if (siguiente.situacion === 'anulado') return 'bg-[var(--color-error)]'
  return 'bg-[var(--color-success)]'
}

/**
 * Línea de tiempo del pedido (RF-17): completados con check verde, el estado en curso resaltado en
 * azul o ámbar, los siguientes en gris y, si se anuló, la línea cortada con un nodo rojo.
 */
export default function OrderTimeline({ historial, estadoActual }: { historial: EventoEstado[]; estadoActual: string }) {
  const pasos = pasosLineaTiempo(historial, estadoActual)

  return (
    <ol aria-label="Línea de tiempo del pedido" className="flex flex-col">
      {pasos.map((paso, i) => {
        const siguiente = pasos[i + 1]
        return (
          <li key={paso.estado} data-situacion={paso.situacion} className="relative flex gap-3 pb-5 last:pb-0">
            {siguiente && (
              <span aria-hidden className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${claseTramo(siguiente)}`} />
            )}
            <span
              aria-hidden
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${claseNodo(paso)}`}
            >
              {paso.situacion === 'completado' && <IconCheck size={16} stroke={3} />}
              {paso.situacion === 'actual' && <IconClock size={16} />}
              {paso.situacion === 'anulado' && <IconX size={16} stroke={3} />}
            </span>
            <div className="min-w-0 pt-1">
              <p
                className={[
                  'text-sm font-semibold',
                  paso.situacion === 'pendiente' ? 'text-[var(--color-text-disabled)]' : 'text-[var(--color-text-primary)]',
                  paso.situacion === 'anulado' ? 'text-[var(--color-error)]' : '',
                ].join(' ')}
              >
                {etiquetaEstado(paso.estado)}
                <span className="sr-only"> ({textoSituacion[paso.situacion]})</span>
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {paso.fecha ? formatFechaHoraLima(paso.fecha) : 'Pendiente'}
              </p>
              {paso.motivo && <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Motivo: {paso.motivo}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
