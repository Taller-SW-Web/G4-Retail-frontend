import { useEffect, useId, useRef, type ReactNode } from 'react'
import { IconX } from '@tabler/icons-react'

interface ModalProps {
  title: string
  /** Sin `onClose` el modal es obligatorio: no se cierra con Escape ni con clic fuera. */
  onClose?: () => void
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  footer?: ReactNode
}

const anchos = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' } as const

/**
 * Diálogo modal reutilizable.
 *
 * F8 lo necesita en dos formas opuestas: la apertura de turno, que es **obligatoria** (RF-20) y por
 * eso se monta sin `onClose`, y el diálogo de confirmación del cierre, que sí se puede cancelar.
 * Gestiona el foco, cierra con Escape y devuelve el foco al elemento anterior al desmontarse.
 */
export default function Modal({ title, onClose, size = 'md', children, footer }: ModalProps) {
  const tituloId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const cerrar = useRef(onClose)
  cerrar.current = onClose

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null
    if (!panel.current?.contains(document.activeElement)) panel.current?.focus()

    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') cerrar.current?.()
    }
    document.addEventListener('keydown', alPulsar)

    return () => {
      document.removeEventListener('keydown', alPulsar)
      anterior?.focus()
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-surface-ink/60 sm:items-center sm:p-4"
      onMouseDown={(evento) => evento.target === evento.currentTarget && onClose?.()}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        className={`flex max-h-full w-full flex-col gap-6 overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl focus:outline-none sm:rounded-2xl ${anchos[size]}`}
      >
        <header className="flex items-start justify-between gap-4">
          <h2 id={tituloId} className="font-heading text-2xl font-bold uppercase">
            {title}
          </h2>
          {onClose && (
            <button
              type="button"
              aria-label="Cerrar"
              title="Cerrar"
              onClick={onClose}
              className="rounded-lg p-2 text-text-primary transition-colors hover:bg-surface-cloud-subtle"
            >
              <IconX size={24} aria-hidden />
            </button>
          )}
        </header>
        {children}
        {footer && <footer className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</footer>}
      </div>
    </div>
  )
}
