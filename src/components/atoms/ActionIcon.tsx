import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../../lib/cx'

interface ActionIconProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Obligatorio: un botón de solo icono necesita nombre accesible. */
  'aria-label': string
  tone?: 'default' | 'danger' | 'inverse'
}

const tonos = {
  default: 'text-text-primary hover:bg-surface-cloud-subtle',
  danger: 'text-error hover:bg-error-bg',
  inverse: 'text-text-inverse hover:bg-surface-ink-soft',
}

export function ActionIcon({ tone = 'default', className, disabled, type = 'button', ...rest }: ActionIconProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      title={rest.title ?? rest['aria-label']}
      className={cx('inline-flex rounded-lg p-2 transition-colors', disabled ? 'cursor-not-allowed text-text-disabled' : tonos[tone], className)}
      {...rest}
    />
  )
}
