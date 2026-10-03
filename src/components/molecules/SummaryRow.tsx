import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

interface SummaryRowProps {
  label: ReactNode
  value: ReactNode
  /** `total`: renglón final destacado. `success`: descuentos. */
  tone?: 'default' | 'success' | 'total'
}

const tonos = {
  default: 'text-sm',
  success: 'text-sm font-semibold text-success',
  total: 'text-xl font-bold',
}

export function SummaryRow({ label, value, tone = 'default' }: SummaryRowProps) {
  return (
    <div className={cx('flex items-baseline justify-between gap-4', tonos[tone])}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}
