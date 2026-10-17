import { IconMapPin, IconPackageExport } from '@tabler/icons-react'
import Badge from '../../atoms/Badge'
import Button from '../../atoms/Button'
import { formatFechaHora } from '../../../lib/format'
import { totalPrendas, type PedidoPickup } from '../../../store/pickup'

interface PickupCardProps {
  pedido: PedidoPickup
  /** Resalta la tarjeta cuando coincide con la búsqueda. */
  destacado?: boolean
  onProcesar: (pedido: PedidoPickup) => void
}

/** RF-18: pedido listo para recojo en la bandeja de la tienda. */
export default function PickupCard({ pedido, destacado, onProcesar }: PickupCardProps) {
  const prendas = totalPrendas(pedido.articulos)
  return (
    <li
      className={`flex flex-col gap-4 rounded-xl border bg-white p-4 ${
        destacado ? 'border-[var(--color-accent-signal)] ring-2 ring-[var(--color-accent-signal)]' : 'border-[var(--color-border-default)]'
      }`}
    >
      <div className="flex flex-col gap-1">
        <p className="font-mono text-xs text-[var(--color-text-secondary)]">{pedido.pedidoId}</p>
        <h3 className="text-xl font-bold">{pedido.clienteNombre}</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">DNI {pedido.clienteDni}</p>
      </div>
      <dl className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--color-text-secondary)]">Contenido</dt>
          <dd className="font-semibold">
            {prendas} {prendas === 1 ? 'prenda' : 'prendas'} · 1 bulto
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--color-text-secondary)]">Listo desde</dt>
          <dd className="font-semibold">{formatFechaHora(pedido.fechaArriboTienda)}</dd>
        </div>
      </dl>
      <div>
        <Badge tone="info">
          <IconMapPin size={14} aria-hidden className="mr-1" />
          {pedido.anaquelUbicacion}
        </Badge>
      </div>
      <Button className="mt-auto gap-2" onClick={() => onProcesar(pedido)}>
        <IconPackageExport size={20} aria-hidden />
        Procesar Retiro
      </Button>
    </li>
  )
}
