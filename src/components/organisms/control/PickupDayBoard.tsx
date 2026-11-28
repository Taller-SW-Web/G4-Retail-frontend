import { useId, useState } from 'react'
import { IconMapPin, IconPackageExport, IconPackageOff, IconSearch } from '@tabler/icons-react'
import Badge from '../../atoms/Badge'
import Button from '../../atoms/Button'
import EmptyState from '../../molecules/EmptyState'
import { totalPrendas, type PedidoPickup } from '../../../api/pickupApi'
import { formatFechaHora } from '../../../lib/format'

interface PickupDayBoardProps {
  pedidos: PedidoPickup[]
  /** Acceso directo al modal de verificación y entrega (RF-18, RF-19). */
  onEntregar: (pedido: PedidoPickup) => void
}

const soloDigitos = (valor: string) => valor.replace(/\D/g, '').slice(0, 8)

/**
 * F11 · RF-30: bandeja rápida de los pickups listos para recojo en la tienda.
 *
 * Cada tarjeta destaca cliente, DNI, código y anaquel para ubicar el bulto sin buscar a ciegas. El
 * filtro por DNI es instantáneo: al teclear el documento del cliente queda solo su tarjeta.
 */
export default function PickupDayBoard({ pedidos, onEntregar }: PickupDayBoardProps) {
  const [dni, setDni] = useState('')
  const campoId = useId()
  const visibles = dni ? pedidos.filter((p) => (p.clienteDni ?? '').includes(dni)) : pedidos

  return (
    <section className="flex flex-col gap-3" aria-label="Pickups de hoy">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Retiro en tienda</h3>
        <Badge tone="info">
          {pedidos.length} {pedidos.length === 1 ? 'paquete' : 'paquetes'}
        </Badge>
      </div>

      <div className="relative">
        <label htmlFor={campoId} className="sr-only">
          Filtrar por DNI del cliente
        </label>
        <IconSearch
          size={20}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
        />
        <input
          id={campoId}
          value={dni}
          onChange={(evento) => setDni(soloDigitos(evento.target.value))}
          inputMode="numeric"
          placeholder="Filtra por DNI del cliente"
          className="w-full rounded-lg border border-[var(--color-border-default)] bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--color-accent-signal)]"
        />
      </div>

      {visibles.length === 0 ? (
        <EmptyState
          icon={<IconPackageOff size={24} />}
          title={pedidos.length === 0 ? 'Sin paquetes por entregar' : 'Sin coincidencias'}
          description={
            pedidos.length === 0
              ? 'No hay pedidos listos para recojo en esta tienda.'
              : 'Ningún paquete listo para recojo es de ese DNI.'
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {visibles.map((pedido) => {
            const prendas = totalPrendas(pedido.articulos)
            return (
              <li
                key={pedido.pedidoId}
                className={`flex flex-col gap-2 rounded-lg border bg-white p-3 ${
                  dni ? 'border-[var(--color-accent-signal)] ring-2 ring-[var(--color-accent-signal-soft)]' : 'border-[var(--color-border-default)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{pedido.clienteNombre}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {pedido.clienteDni ? `DNI ${pedido.clienteDni}` : 'DNI no registrado'} ·{' '}
                      <span className="font-mono">{pedido.pedidoId}</span>
                    </p>
                  </div>
                  <Badge tone="info">
                    <IconMapPin size={14} aria-hidden="true" className="mr-1" />
                    {pedido.anaquelUbicacion}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {prendas} {prendas === 1 ? 'prenda' : 'prendas'} · listo desde {formatFechaHora(pedido.fechaArriboTienda)}
                </p>
                <Button className="gap-2" onClick={() => onEntregar(pedido)}>
                  <IconPackageExport size={20} aria-hidden="true" />
                  Entregar paquete
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
