import type { InputHTMLAttributes, ReactNode, Ref } from 'react'
import { cx } from '../../lib/cx'

export type EstadoInput = 'default' | 'error' | 'warning' | 'success'

const bordes: Record<EstadoInput, string> = {
  default: 'border-border-default',
  error: 'border-error',
  warning: 'border-warning',
  success: 'border-success',
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  estado?: EstadoInput
  /** Icono de 20px dentro del input. */
  icon?: ReactNode
  ref?: Ref<HTMLInputElement>
}

export function Input({ estado = 'default', icon, className, ref, ...rest }: InputProps) {
  return (
    <div className="relative w-full">
      {icon && <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-text-secondary">{icon}</span>}
      <input
        ref={ref}
        aria-invalid={estado === 'error' || undefined}
        className={cx(
          'w-full rounded-lg border bg-white px-4 py-2 text-base placeholder:text-text-disabled',
          'focus:border-transparent focus:ring-2 focus:ring-accent-signal focus:outline-none',
          'disabled:bg-surface-cloud-subtle disabled:text-text-disabled',
          bordes[estado],
          icon ? 'pl-12' : undefined,
          className,
        )}
        {...rest}
      />
    </div>
  )
}
