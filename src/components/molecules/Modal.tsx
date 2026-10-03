import { useEffect, useId, useRef, type ReactNode } from 'react'
import { IconX } from '@tabler/icons-react'
import { ActionIcon } from '../atoms/ActionIcon'
import { cx } from '../../lib/cx'

interface ModalProps {
  title: string
  /** Sin `onClose` el modal es obligatorio: no se cierra con Escape ni clic fuera. */
  onClose?: () => void
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  footer?: ReactNode
}

const anchos = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }

export function Modal({ title, onClose, size = 'md', children, footer }: ModalProps) {
  const tituloId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const cerrar = useRef(onClose)
  cerrar.current = onClose

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null
    if (!panel.current?.contains(document.activeElement)) panel.current?.focus()
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar.current?.()
    }
    document.addEventListener('keydown', alPulsar)
    return () => {
      document.removeEventListener('keydown', alPulsar)
      anterior?.focus()
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-surface-ink/60 xs:items-center xs:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        className={cx('flex max-h-full w-full flex-col gap-6 overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl focus:outline-none xs:rounded-2xl', anchos[size])}
      >
        <header className="flex items-start justify-between gap-4">
          <h2 id={tituloId} className="font-heading text-2xl font-bold uppercase">
            {title}
          </h2>
          {onClose && (
            <ActionIcon aria-label="Cerrar" onClick={onClose}>
              <IconX size={24} aria-hidden />
            </ActionIcon>
          )}
        </header>
        {children}
        {footer && <footer className="flex flex-col-reverse gap-2 xs:flex-row xs:justify-end">{footer}</footer>}
      </div>
    </div>
  )
}
