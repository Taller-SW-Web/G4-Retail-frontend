import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const styles: Record<ButtonVariant, string> = {
    primary:
      'bg-[var(--color-action-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-action-primary-hover)] hover:text-[var(--color-text-inverse)]',
    secondary:
      'bg-[var(--color-surface-cloud-subtle)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-default)]',
    outline:
      'border border-[var(--color-text-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-cloud-subtle)]',
    ghost: 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-cloud-subtle)]',
  }

  return (
    <button
      className={[
        'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60',
        styles[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
