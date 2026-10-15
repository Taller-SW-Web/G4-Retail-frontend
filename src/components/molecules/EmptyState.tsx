import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  description: string
  icon?: ReactNode
}

export default function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div
      role="status"
      className="flex min-h-36 flex-col items-center justify-center rounded-xl bg-[var(--color-surface-cloud-subtle)] p-6 text-center"
    >
      {icon ? <div className="mb-3 text-[var(--color-text-secondary)]" aria-hidden="true">{icon}</div> : null}
      <h3 className="font-semibold text-[var(--color-text-primary)]">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-[var(--color-text-secondary)]">{description}</p>
    </div>
  )
}
