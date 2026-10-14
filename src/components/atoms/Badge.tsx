import type { ReactNode } from 'react'

type BadgeProps = {
  tone?: 'neutral' | 'success' | 'warning' | 'info' | 'brand'
  children: ReactNode
}

export default function Badge({ tone = 'neutral', children }: BadgeProps) {
  const palettes = {
    neutral: 'bg-[var(--color-surface-cloud-subtle)] text-[var(--color-text-primary)]',
    success: 'bg-[#EBFBEE] text-[#2F9E44]',
    warning: 'bg-[#FFF9DB] text-[#F08C00]',
    info: 'bg-[#E7F5FF] text-[#1971C2]',
    brand: 'bg-[var(--color-accent-volt)] text-[var(--color-text-primary)]',
  }

  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
        palettes[tone],
      ].join(' ')}
    >
      {children}
    </span>
  )
}
