import { useState, type FormEvent } from 'react'
import { IconPlayerPlay, IconTrash } from '@tabler/icons-react'
import Button from '../../atoms/Button'
import Alert from '../../molecules/Alert'
import Modal from '../../molecules/Modal'
import { formatCurrency, formatFechaHora } from '../../../lib/format'
import { getCartItemCount, getCartSubtotal } from '../../../lib/cart'
import { useCartStore } from '../../../store/cart'

interface HoldCartModalProps {
  onClose: () => void
  onSuccess: () => void
}

/**
 * Modal para solicitar el identificador o alias de la venta a suspender (RF-10).
 */
export function HoldCartModal({ onClose, onSuccess }: HoldCartModalProps) {
  const [alias, setAlias] = useState('')
  const pausarVenta = useCartStore((s) => s.pausarVenta)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!alias.trim()) return

    const pausado = pausarVenta(alias.trim())
    if (pausado) {
      onSuccess()
      onClose()
    }
  }

  return (
    <Modal
      title="Pausar Venta en Curso"
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-pausar-venta"
            variant="primary"
            disabled={!alias.trim()}
          >
            Pausar y Liberar POS
          </Button>
        </>
      }
    >
      <form id="form-pausar-venta" onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="alias-ticket" className="block text-sm font-semibold text-[var(--color-text-primary)]">
          Identificador o alias de la venta
        </label>
        <input
          id="alias-ticket"
          type="text"
          autoFocus
          maxLength={60}
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="Ej. Probador 3 - Zapatillas Running"
          className="w-full rounded-lg border border-[var(--color-border-default)] px-3 py-2 text-sm focus:border-[var(--color-action-primary)] focus:outline-none"
        />
        <p className="text-xs text-[var(--color-text-secondary)]">
          El carrito se guardará en la bandeja de suspendidos durante 2 horas y el mostrador quedará libre para el siguiente cliente.
        </p>
      </form>
    </Modal>
  )
}

interface HeldCartsModalProps {
  onClose: () => void
  onResumed: () => void
}

/**
 * Bandeja de ventas en espera / probadores con reanudación en 1 clic (RF-10).
 */
export function HeldCartsModal({ onClose, onResumed }: HeldCartsModalProps) {
  const carritosEnEspera = useCartStore((s) => s.carritosEnEspera)
  const itemsActuales = useCartStore((s) => s.items)
  const reanudarVenta = useCartStore((s) => s.reanudarVenta)
  const eliminarVentaEnEspera = useCartStore((s) => s.eliminarVentaEnEspera)

  const mostradorOcupado = itemsActuales.length > 0

  const handleReanudar = (id: string) => {
    const reanudado = reanudarVenta(id)
    if (reanudado) {
      onResumed()
      onClose()
    }
  }

  return (
    <Modal
      title={`Ventas en Espera (${carritosEnEspera.length})`}
      size="md"
      onClose={onClose}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <div className="space-y-4">
        {mostradorOcupado && carritosEnEspera.length > 0 && (
          <Alert tono="warning">
            Pausa o limpia la venta actual del mostrador antes de reanudar una venta en espera.
          </Alert>
        )}

        {carritosEnEspera.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--color-text-secondary)]">
            No hay ventas en espera actualmente.
          </p>
        ) : (
          <div className="space-y-3">
            {carritosEnEspera.map((carrito) => {
              const cantPrendas = getCartItemCount(carrito.items)
              const subtotal = getCartSubtotal(carrito.items)

              return (
                <div
                  key={carrito.carritoEsperaId}
                  className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-border-default)] bg-white p-4 shadow-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[var(--color-text-primary)]">
                      {carrito.aliasTicket}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {cantPrendas} {cantPrendas === 1 ? 'prenda' : 'prendas'} · Total aprox.{' '}
                      <span className="font-semibold">{formatCurrency(subtotal)}</span>
                    </p>
                    <p className="text-[11px] text-[var(--color-text-secondary)]">
                      Iniciado: {formatFechaHora(carrito.fechaHoraInicio)}
                      {carrito.cliente && ` · Cliente: ${carrito.cliente.nombre}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      disabled={mostradorOcupado}
                      onClick={() => handleReanudar(carrito.carritoEsperaId)}
                      className="gap-1.5 px-3 py-1.5 text-xs"
                    >
                      <IconPlayerPlay size={16} />
                      Reanudar
                    </Button>
                    <button
                      type="button"
                      onClick={() => eliminarVentaEnEspera(carrito.carritoEsperaId)}
                      className="rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-red-50 hover:text-red-600"
                      aria-label="Descartar ticket en espera"
                      title="Descartar ticket"
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}
