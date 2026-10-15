import type { ReactNode } from 'react'

type StatCardProps = {
  icon: ReactNode
  label: string
  value: string | number
  tone: 'volt' | 'signal' | 'action'
}

const toneClasses = {
  volt: 'bg-[var(--color-accent-volt-soft)] text-[var(--color-text-primary)]',
  signal: 'bg-[var(--color-accent-signal-soft)] text-[var(--color-accent-signal)]',
  action: 'bg-[var(--color-action-primary-soft)] text-[var(--color-text-primary)]',
}

export default function StatCard({ icon, label, value, tone }: StatCardProps) {
  return (
    <section
      aria-label={`${label}: ${value}`}
      className="rounded-2xl border border-[var(--color-border-default)] bg-white p-4 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-2 ${toneClasses[tone]}`} aria-hidden="true">
          {icon}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{value}</p>
        </div>
      </div>
    </section>
  )
}
