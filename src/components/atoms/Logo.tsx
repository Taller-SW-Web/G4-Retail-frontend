import { IconRun } from '@tabler/icons-react'
import { cx } from '../../lib/cx'

const colores = { principal: 'text-surface-ink', volt: 'text-accent-volt', signal: 'text-accent-signal' }

interface LogoProps {
  /** `volt` solo sobre superficies oscuras. */
  variant?: keyof typeof colores
  compact?: boolean
}

export function Logo({ variant = 'principal', compact }: LogoProps) {
  return (
    <span className={cx('inline-flex flex-col leading-none', colores[variant])} role="img" aria-label="Inka Athletics">
      <span className={cx('flex items-center font-heading font-bold italic', compact ? 'text-2xl' : 'text-[32px]')} aria-hidden>
        INKA
        <IconRun size={compact ? 24 : 32} stroke={2} />
      </span>
      {!compact && (
        <span className="text-xs font-semibold tracking-[0.35em]" aria-hidden>
          ATHLETICS
        </span>
      )}
    </span>
  )
}
