import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../../api/http'
import { obtenerPedido, type DetallePedido } from '../../../api/pedidoApi'
import { esPickup } from '../../../lib/pedidos'
import Button from '../../atoms/Button'
import Alert from '../../molecules/Alert'
import Modal from '../../molecules/Modal'
import OrderTimeline from './OrderTimeline'
import OrderTrackingCard from './OrderTrackingCard'

type Props = {
  pedidoId: string
  onClose: () => void
}

/**
 * Detalle y trazabilidad de un pedido (RF-17): datos, prendas y línea de tiempo de estados.
 * Si el cliente recoge en tienda, avisa la tienda de recojo y enlaza la bandeja Pickup (F7).
 */
export default function OrderHistoryModal({ pedidoId, onClose }: Props) {
  const [pedido, setPedido] = useState<DetallePedido | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    setPedido(null)
    setError(null)
    obtenerPedido(pedidoId)
      .then((detalle) => vigente && setPedido(detalle))
      .catch((err) => {
        if (!vigente) return
        if (err instanceof ApiError && err.status === 404) setError('El pedido ya no figura en Ventas.')
        else setError(err instanceof ApiError ? err.message : 'Revisa la conexión e intenta nuevamente.')
      })
    return () => {
      vigente = false
    }
  }, [pedidoId, intento])

  const recojoPendiente =
    pedido && esPickup(pedido.modalidad) && !['ENTREGADO', 'ANULADO'].includes(pedido.estadoComercial)

  return (
    <Modal title={`Pedido ${pedidoId}`} size="lg" onClose={onClose}>
      {error ? (
        <div className="flex flex-col items-start gap-3">
          <Alert tono="error" title="No se pudo cargar el pedido">
            {error}
          </Alert>
          <Button variant="secondary" onClick={() => setIntento((n) => n + 1)}>
            Reintentar
          </Button>
        </div>
      ) : !pedido ? (
        <div role="status" aria-label="Cargando pedido" className="flex animate-pulse flex-col gap-3">
          <div className="h-6 w-1/2 rounded bg-[var(--color-surface-cloud-subtle)]" />
          <div className="h-20 rounded bg-[var(--color-surface-cloud-subtle)]" />
          <div className="h-32 rounded bg-[var(--color-surface-cloud-subtle)]" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {esPickup(pedido.modalidad) && (
            <Alert tono="info" title="Recojo en tienda">
              <p>
                Se entrega en <strong>{pedido.tiendaId ?? 'la tienda indicada por el cliente'}</strong>.
                {recojoPendiente && ' Cuando llegue a la tienda aparecerá en la bandeja Pickup para su entrega.'}
              </p>
              {recojoPendiente && (
                <Link to="/pickup" className="font-semibold underline">
                  Ir a la bandeja Pickup
                </Link>
              )}
            </Alert>
          )}
          <OrderTrackingCard pedido={pedido} />
          <section aria-label="Seguimiento del pedido" className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">Seguimiento</h3>
            <OrderTimeline historial={pedido.historialEstados} estadoActual={pedido.estadoComercial} />
          </section>
        </div>
      )}
    </Modal>
  )
}
