import type { ReactNode } from 'react'

type BadgeProps = {
  tone?: 'neutral' | 'success' | 'warning' | 'info' | 'error' | 'brand'
  children: ReactNode
}

export default function Badge({ tone = 'neutral', children }: BadgeProps) {
  const palettes = {
    neutral: 'bg-[var(--color-surface-cloud-subtle)] text-[var(--color-text-primary)]',
    success: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
    warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
    info: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
    error: 'bg-[var(--color-error-bg)] text-[var(--color-error)]',
    brand: 'bg-[var(--color-accent-volt)] text-[var(--color-text-primary)]',
  }

  return (
    <span
      data-tone={tone}
      className={[
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
        palettes[tone],
      ].join(' ')}
    >
      {children}
    </span>
  )
}
