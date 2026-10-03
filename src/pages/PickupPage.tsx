import { useEffect, useState } from 'react'
import { IconPackage } from '@tabler/icons-react'
import { Badge } from '../components/atoms/Badge'
import { Spinner } from '../components/atoms/Spinner'
import { Alert } from '../components/molecules/Alert'
import { EmptyState } from '../components/molecules/EmptyState'
import { FormField } from '../components/molecules/FormField'
import { SearchBar } from '../components/molecules/SearchBar'
import { DeliveryModal } from '../components/organisms/DeliveryModal'
import { PickupCard } from '../components/organisms/PickupCard'
import { listarPickups } from '../services'
import { usePickupStore } from '../store/pickup'
import type { PedidoPickup } from '../types'

/** Fecha local `YYYY-MM-DD`, comparable con el valor de un input date. */
const diaLocal = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** F7: bandeja de pedidos listos para recojo y confirmación de entrega (RF-18, RF-19). */
export function PickupPage() {
  const setPendientes = usePickupStore((s) => s.setPendientes)
  const [pedidos, setPedidos] = useState<PedidoPickup[] | null>(null)
  const [error, setError] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [fecha, setFecha] = useState('')
  const [enEntrega, setEnEntrega] = useState<PedidoPickup | null>(null)

  useEffect(() => {
    listarPickups()
      .then(setPedidos)
      .catch(() => setError(true))
  }, [])

  const listos = pedidos?.filter((p) => p.estado === 'LISTO_PARA_RECOJO') ?? []
  useEffect(() => {
    if (pedidos) setPendientes(listos.length)
  }, [pedidos, listos.length, setPendientes])

  const termino = busqueda.trim().toLowerCase()
  const coincide = (p: PedidoPickup) => !termino || p.clienteDni.includes(termino) || p.pedidoId.toLowerCase().includes(termino)
  const visibles = listos.filter((p) => coincide(p) && (!fecha || diaLocal(p.fechaArriboTienda) === fecha))
  const noDisponible = !!termino && pedidos?.some((p) => p.estado !== 'LISTO_PARA_RECOJO' && coincide(p))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-heading text-[32px] leading-10 font-bold uppercase">Entregas en Tienda (Pickup)</h1>
        {pedidos && <Badge tono="promo">{listos.length} pendientes</Badge>}
      </div>

      <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <SearchBar autoFocus value={busqueda} onChange={setBusqueda} label="Buscar pedido" placeholder="Busca por DNI del comprador o código de pedido" />
        <FormField label="Fecha de arribo a tienda" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="py-4" />
      </div>

      {noDisponible && (
        <Alert tono="warning">
          El pedido se encuentra en camino o asignado a otra sede. No está disponible para entrega física en este local comercial
        </Alert>
      )}

      {error ? (
        <Alert tono="error" title="No se pudo cargar la bandeja de recojos">
          Revisa la conexión e intenta nuevamente.
        </Alert>
      ) : !pedidos ? (
        <div className="flex justify-center p-8" role="status" aria-label="Cargando pedidos">
          <Spinner size={24} />
        </div>
      ) : visibles.length === 0 ? (
        !noDisponible && (
          <EmptyState icon={<IconPackage size={24} />} title={listos.length === 0 ? 'Todo entregado' : 'Sin coincidencias'}>
            {listos.length === 0 ? 'No hay paquetes pendientes de recojo en esta tienda.' : 'Ningún pedido listo para recojo coincide con la búsqueda.'}
          </EmptyState>
        )
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {visibles.map((pedido) => (
            <PickupCard key={pedido.pedidoId} pedido={pedido} destacado={!!termino} onProcesar={setEnEntrega} />
          ))}
        </ul>
      )}

      {enEntrega && (
        <DeliveryModal
          pedido={enEntrega}
          onClose={() => setEnEntrega(null)}
          onEntregado={(pedidoId) => setPedidos((lista) => lista?.filter((p) => p.pedidoId !== pedidoId) ?? null)}
        />
      )}
    </div>
  )
}
