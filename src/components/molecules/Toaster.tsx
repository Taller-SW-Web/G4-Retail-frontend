import { IconAlertCircle, IconAlertTriangle, IconCircleCheck, IconInfoCircle, IconX } from '@tabler/icons-react'
import { ActionIcon } from '../atoms/ActionIcon'
import { useToastStore, type TipoToast } from '../../store/toast'
import { cx } from '../../lib/cx'

const estilos: Record<TipoToast, { clases: string; icono: string; Icono: typeof IconInfoCircle }> = {
  success: { clases: 'border-success bg-success-bg', icono: 'text-success', Icono: IconCircleCheck },
  error: { clases: 'border-error bg-error-bg', icono: 'text-error', Icono: IconAlertCircle },
  warning: { clases: 'border-warning bg-warning-bg', icono: 'text-warning', Icono: IconAlertTriangle },
  info: { clases: 'border-info bg-info-bg', icono: 'text-info', Icono: IconInfoCircle },
}

/** Notificaciones flotantes; se monta una sola vez en la plantilla. */
export function Toaster() {
  const { toasts, cerrar } = useToastStore()
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col items-center gap-2 print:hidden">
      {toasts.map(({ id, tipo, mensaje }) => {
        const { clases, icono, Icono } = estilos[tipo]
        return (
          <div key={id} role="status" className={cx('pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-lg border p-4 text-sm font-semibold shadow-lg', clases)}>
            <Icono size={20} className={cx('shrink-0', icono)} aria-hidden />
            <span className="flex-1">{mensaje}</span>
            <ActionIcon aria-label="Cerrar notificación" onClick={() => cerrar(id)}>
              <IconX size={16} aria-hidden />
            </ActionIcon>
          </div>
        )
      })}
    </div>
  )
}
