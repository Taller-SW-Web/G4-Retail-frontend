import { IconLock } from '@tabler/icons-react'
import Button from '../../atoms/Button'
import Modal from '../../molecules/Modal'
import { MENSAJE_BLOQUEO } from '../../../lib/cuarentena'

type QuarantineBlockedModalProps = {
  /** Prenda que se intentó vender: nombre y SKU de la variante. */
  nombre: string
  sku: string
  onClose: () => void
}

/**
 * Advertencia al escanear o intentar vender una prenda en cuarentena (F12 · RF-33, CA-RF33-02).
 * La prenda no se agrega al carrito.
 */
export default function QuarantineBlockedModal({ nombre, sku, onClose }: QuarantineBlockedModalProps) {
  return (
    <Modal
      title="Venta bloqueada"
      size="sm"
      onClose={onClose}
      footer={
        <Button variant="primary" onClick={onClose} autoFocus>
          Entendido
        </Button>
      }
    >
      <div role="alert" className="flex flex-col items-center gap-3 text-center">
        <span className="rounded-full bg-[var(--color-error-bg)] p-3 text-[var(--color-error)]">
          <IconLock size={32} aria-hidden="true" />
        </span>
        <p className="font-heading text-xl font-bold uppercase text-[var(--color-error)]">{MENSAJE_BLOQUEO}</p>
        <p className="text-sm text-[var(--color-text-primary)]">
          <span className="font-semibold">{nombre}</span> · SKU <span className="tabular-nums">{sku}</span>
        </p>
        <p className="text-sm text-[var(--color-text-secondary)]">
          La prenda tiene una incidencia abierta y está en revisión física. Retírala del mostrador y ofrece otra unidad.
        </p>
      </div>
    </Modal>
  )
}
