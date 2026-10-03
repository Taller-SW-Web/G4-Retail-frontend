import { useState, type FormEvent } from 'react'
import { IconPlayerPlay } from '@tabler/icons-react'
import { Button } from '../atoms/Button'
import { Alert } from '../molecules/Alert'
import { FormField } from '../molecules/FormField'
import { Modal } from '../molecules/Modal'
import { formatHora } from '../../lib/format'
import { totalArticulos } from '../../lib/totals'
import type { CarritoEspera } from '../../types'

interface HoldCartModalProps {
  onClose: () => void
  onConfirm: (alias: string) => Promise<void>
}

const FORM_ID = 'pausar-venta'

/** RF-10: pide un alias para dejar la venta en espera (cliente en probadores). */
export function HoldCartModal({ onClose, onConfirm }: HoldCartModalProps) {
  const [alias, setAlias] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!alias.trim() || guardando) return
    setGuardando(true)
    await onConfirm(alias.trim()).finally(() => setGuardando(false))
  }

  return (
    <Modal
      title="Pausar Venta"
      size="sm"
      onClose={guardando ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} disabled={!alias.trim()} loading={guardando}>
            Pausar Venta
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={enviar}>
        <FormField
          label="Identificador de la venta"
          autoFocus
          maxLength={60}
          placeholder="Probador 3 - Zapatillas Running"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          ayuda="El carrito queda guardado y el mostrador libre para el siguiente cliente."
        />
      </form>
    </Modal>
  )
}

interface HeldCartsModalProps {
  carritos: CarritoEspera[]
  /** No se puede reanudar encima de una venta con productos. */
  carritoOcupado: boolean
  onResume: (carrito: CarritoEspera) => void
  onClose: () => void
}

/** RF-10: bandeja de ventas suspendidas con reanudación en 1 clic. */
export function HeldCartsModal({ carritos, carritoOcupado, onResume, onClose }: HeldCartsModalProps) {
  return (
    <Modal title="Ventas en Espera" onClose={onClose}>
      {carritoOcupado && carritos.length > 0 && (
        <Alert tono="info">Pausa o limpia la venta actual para reanudar una venta en espera.</Alert>
      )}
      {carritos.length === 0 ? (
        <p className="text-sm text-text-secondary">No hay ventas en espera.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {carritos.map((carrito) => (
            <li key={carrito.carritoEsperaId} className="flex items-center justify-between gap-4 rounded-xl border border-border-default p-4">
              <div className="min-w-0 text-sm">
                <p className="truncate font-semibold">{carrito.aliasTicket}</p>
                <p className="text-text-secondary">
                  {totalArticulos(carrito.items)} prendas · Inicio {formatHora(carrito.fechaHoraInicio)}
                  {carrito.cliente && ` · ${carrito.cliente.nombre}`}
                </p>
              </div>
              <Button disabled={carritoOcupado} icon={<IconPlayerPlay size={20} aria-hidden />} onClick={() => onResume(carrito)}>
                Reanudar
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
