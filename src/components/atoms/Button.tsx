import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'confirm' | 'secondary' | 'outline' | 'danger'

const variantes: Record<ButtonVariant, string> = {
  primary: 'bg-action-primary text-text-primary hover:bg-action-primary-hover hover:text-text-inverse',
  confirm: 'bg-accent-signal text-text-inverse hover:brightness-90',
  secondary: 'bg-surface-cloud-subtle text-text-primary hover:bg-border-default',
  outline: 'border border-text-primary text-text-primary hover:bg-surface-cloud-subtle',
  danger: 'border border-error text-error hover:bg-error-bg',
}

const deshabilitado = 'cursor-not-allowed border border-border-default bg-surface-cloud-subtle text-text-disabled'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  /** `lg`: objetivo táctil amplio para terminales de mostrador. */
  size?: 'md' | 'lg'
  icon?: ReactNode
  loading?: boolean
  fullWidth?: boolean
}

export function Button({ variant = 'primary', size = 'md', icon, loading, fullWidth, disabled, className, children, type = 'button', ...rest }: ButtonProps) {
  const inactivo = disabled || loading
  return (
    <button
      type={type}
      disabled={inactivo}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors',
        size === 'lg' ? 'py-4' : 'py-2',
        inactivo ? deshabilitado : variantes[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  )
}
