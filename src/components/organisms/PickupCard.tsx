import { IconMapPin, IconPackageExport } from '@tabler/icons-react'
import { Badge } from '../atoms/Badge'
import { Button } from '../atoms/Button'
import { formatFechaHora } from '../../lib/format'
import { totalArticulos } from '../../lib/totals'
import { cx } from '../../lib/cx'
import type { PedidoPickup } from '../../types'

interface PickupCardProps {
  pedido: PedidoPickup
  /** Resalta la tarjeta cuando coincide con la búsqueda. */
  destacado?: boolean
  onProcesar: (pedido: PedidoPickup) => void
}

/** RF-18: pedido listo para recojo en la bandeja de la tienda. */
export function PickupCard({ pedido, destacado, onProcesar }: PickupCardProps) {
  const prendas = totalArticulos(pedido.articulos)
  return (
    <li className={cx('flex flex-col gap-4 rounded-xl border bg-white p-4', destacado ? 'border-accent-signal ring-2 ring-accent-signal' : 'border-border-default')}>
      <div className="flex flex-col gap-1">
        <p className="text-xs text-text-secondary">{pedido.pedidoId}</p>
        <h3 className="text-xl font-bold">{pedido.clienteNombre}</h3>
        <p className="text-sm text-text-secondary">DNI {pedido.clienteDni}</p>
      </div>
      <dl className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-text-secondary">Contenido</dt>
          <dd className="font-semibold">
            {prendas} {prendas === 1 ? 'prenda' : 'prendas'} · 1 bulto
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-text-secondary">Listo desde</dt>
          <dd className="font-semibold">{formatFechaHora(pedido.fechaArriboTienda)}</dd>
        </div>
      </dl>
      <div>
        <Badge tono="nuevo" icon={<IconMapPin size={16} aria-hidden />}>
          {pedido.anaquelUbicacion}
        </Badge>
      </div>
      <Button className="mt-auto" icon={<IconPackageExport size={20} aria-hidden />} onClick={() => onProcesar(pedido)}>
        Procesar Retiro
      </Button>
    </li>
  )
}
