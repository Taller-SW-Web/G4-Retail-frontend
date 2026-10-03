import type { ReactNode } from 'react'
import { IconAlertCircle, IconAlertTriangle, IconCircleCheck, IconInfoCircle } from '@tabler/icons-react'
import { cx } from '../../lib/cx'

export type TonoAlerta = 'success' | 'warning' | 'error' | 'info'

const estilos: Record<TonoAlerta, { clases: string; icono: string; Icono: typeof IconInfoCircle }> = {
  success: { clases: 'border-success bg-success-bg', icono: 'text-success', Icono: IconCircleCheck },
  warning: { clases: 'border-warning bg-warning-bg', icono: 'text-warning', Icono: IconAlertTriangle },
  error: { clases: 'border-error bg-error-bg', icono: 'text-error', Icono: IconAlertCircle },
  info: { clases: 'border-info bg-info-bg', icono: 'text-info', Icono: IconInfoCircle },
}

interface AlertProps {
  tono: TonoAlerta
  title?: string
  children?: ReactNode
  className?: string
}

export function Alert({ tono, title, children, className }: AlertProps) {
  const { clases, icono, Icono } = estilos[tono]
  return (
    <div role={tono === 'error' ? 'alert' : 'status'} className={cx('flex gap-2 rounded-lg border p-4 text-sm', clases, className)}>
      <Icono size={20} className={cx('shrink-0', icono)} aria-hidden />
      <div className="flex flex-col gap-1">
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  )
}
