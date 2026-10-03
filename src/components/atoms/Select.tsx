import type { SelectHTMLAttributes } from 'react'
import { cx } from '../../lib/cx'

export function Select({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cx(
        'w-full rounded-lg border border-border-default bg-white px-4 py-2 text-base',
        'focus:border-transparent focus:ring-2 focus:ring-accent-signal focus:outline-none',
        'disabled:bg-surface-cloud-subtle disabled:text-text-disabled',
        className,
      )}
      {...rest}
    />
  )
}
