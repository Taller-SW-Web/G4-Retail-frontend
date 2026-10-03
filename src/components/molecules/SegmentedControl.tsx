import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

interface Opcion<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

interface SegmentedControlProps<T extends string> {
  label: string
  options: Opcion<T>[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
}

/** Selector excluyente de pocas opciones (tipo de documento, medio de pago, comprobante). */
export function SegmentedControl<T extends string>({ label, options, value, onChange, disabled }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-surface-cloud-subtle p-1">
      {options.map((opcion) => {
        const activa = opcion.value === value
        return (
          <button
            key={opcion.value}
            type="button"
            role="radio"
            aria-checked={activa}
            disabled={disabled}
            onClick={() => onChange(opcion.value)}
            className={cx(
              'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              activa ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary',
              disabled && 'cursor-not-allowed',
            )}
          >
            {opcion.icon}
            {opcion.label}
          </button>
        )
      })}
    </div>
  )
}
