import type { PedidoResumen } from '../../../api/pedidoApi'
import { formatCurrency } from '../../../lib/format'
import { etiquetaCanal, formatFechaHoraLima } from '../../../lib/pedidos'
import Button from '../../atoms/Button'
import OrderStatusBadge from './OrderStatusBadge'

type Props = {
  pedidos: PedidoResumen[]
  onVerDetalle: (pedidoId: string) => void
}

/** Compras históricas del cliente (RF-16): N° de pedido, fecha, canal, total y estado. */
export default function OrderHistoryTable({ pedidos, onVerDetalle }: Props) {
  return (
    <div className="relative overflow-x-auto rounded-2xl [contain:inline-size] border border-[var(--color-border-default)] bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Pedidos encontrados</caption>
        <thead className="bg-[var(--color-surface-cloud-subtle)] text-xs uppercase text-[var(--color-text-secondary)]">
          <tr>
            <th scope="col" className="px-4 py-3">N° Pedido</th>
            <th scope="col" className="px-4 py-3">Fecha</th>
            <th scope="col" className="px-4 py-3">Canal</th>
            <th scope="col" className="px-4 py-3 text-right">Total</th>
            <th scope="col" className="px-4 py-3">Estado</th>
            <th scope="col" className="px-4 py-3"><span className="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => (
            <tr key={pedido.pedidoId} className="border-t border-[var(--color-border-default)]">
              <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold">{pedido.pedidoId}</td>
              <td className="whitespace-nowrap px-4 py-3">{formatFechaHoraLima(pedido.fechaCreacion)}</td>
              <td className="px-4 py-3">{etiquetaCanal(pedido.canal)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right">{formatCurrency(pedido.total)}</td>
              <td className="px-4 py-3">
                <OrderStatusBadge estado={pedido.estadoComercial} />
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  variant="outline"
                  onClick={() => onVerDetalle(pedido.pedidoId)}
                  aria-label={`Ver detalle del pedido ${pedido.pedidoId}`}
                >
                  Ver detalle
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
