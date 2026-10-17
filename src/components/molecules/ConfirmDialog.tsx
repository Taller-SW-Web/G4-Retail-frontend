import type { ReactNode } from 'react'
import Button from '../atoms/Button'
import Modal from './Modal'

/** Variantes que expone el átomo `Button`; no se inventan tonos nuevos. */
type VarianteBoton = 'primary' | 'secondary' | 'outline' | 'ghost'

interface ConfirmDialogProps {
  title: string
  children: ReactNode
  confirmLabel: string
  confirmVariant?: VarianteBoton
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Confirmación de una acción irreversible.
 *
 * El cierre de turno (RF-22) no se puede deshacer: cierra la gaveta y termina el turno, así que
 * pasa por aquí. Mientras la operación está en curso el diálogo no se puede cerrar, para que un
 * descuido no deje el cierre a medias.
 */
export default function ConfirmDialog({
  title,
  children,
  confirmLabel,
  confirmVariant = 'primary',
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      title={title}
      size="sm"
      onClose={loading ? undefined : onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={loading} autoFocus>
            {loading ? 'Procesando…' : confirmLabel}
          </Button>
        </>
      }
    >
      <p>{children}</p>
    </Modal>
  )
}
