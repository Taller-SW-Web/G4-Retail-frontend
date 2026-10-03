import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

interface ChipProps {
  selected: boolean
  onClick: () => void
  children: ReactNode
}

/** Filtro rápido tipo píldora (RF-04). */
export function Chip({ selected, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cx(
        'rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors',
        selected
          ? 'border-surface-ink bg-surface-ink text-text-inverse'
          : 'border-border-default bg-white text-text-primary hover:bg-surface-cloud-subtle',
      )}
    >
      {children}
    </button>
  )
}
