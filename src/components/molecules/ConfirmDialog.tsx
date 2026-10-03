import type { ReactNode } from 'react'
import { Button, type ButtonVariant } from '../atoms/Button'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  title: string
  children: ReactNode
  confirmLabel: string
  confirmVariant?: ButtonVariant
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, children, confirmLabel, confirmVariant = 'primary', loading, onConfirm, onCancel }: ConfirmDialogProps) {
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
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading} autoFocus>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p>{children}</p>
    </Modal>
  )
}
