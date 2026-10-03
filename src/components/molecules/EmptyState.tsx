import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  children?: ReactNode
}

export function EmptyState({ icon, title, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border-default p-8 text-center">
      <span className="text-text-secondary" aria-hidden>
        {icon}
      </span>
      <p className="text-lg leading-[26px] font-semibold">{title}</p>
      {children && <div className="text-sm text-text-secondary">{children}</div>}
    </div>
  )
}
