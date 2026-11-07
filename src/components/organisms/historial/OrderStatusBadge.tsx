import Badge from '../../atoms/Badge'
import { etiquetaEstado, tonoEstado } from '../../../lib/pedidos'

/** Estado comercial del pedido con su color semántico (RF-17). */
export default function OrderStatusBadge({ estado }: { estado: string }) {
  return <Badge tone={tonoEstado(estado)}>{etiquetaEstado(estado)}</Badge>
}
