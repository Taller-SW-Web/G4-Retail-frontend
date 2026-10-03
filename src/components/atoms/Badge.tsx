import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

export type TonoBadge = 'success' | 'warning' | 'error' | 'info' | 'promo' | 'nuevo' | 'neutral'

const tonos: Record<TonoBadge, string> = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-text-primary',
  error: 'bg-error-bg text-error',
  info: 'bg-info-bg text-info',
  promo: 'bg-accent-volt text-text-primary',
  nuevo: 'bg-accent-signal-soft text-accent-signal',
  neutral: 'bg-surface-cloud-subtle text-text-secondary',
}

interface BadgeProps {
  tono?: TonoBadge
  /** Icono de 16px: un estado nunca se comunica solo con color. */
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export function Badge({ tono = 'neutral', icon, children, className }: BadgeProps) {
  return (
    <span className={cx('inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-semibold', tonos[tono], className)}>
      {icon}
      {children}
    </span>
  )
}
