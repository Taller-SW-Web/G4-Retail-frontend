import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconArrowLeft, IconPackage } from '@tabler/icons-react'
import Badge from '../components/atoms/Badge'
import Button from '../components/atoms/Button'
import Alert from '../components/molecules/Alert'
import EmptyState from '../components/molecules/EmptyState'
import SearchBar from '../components/molecules/SearchBar'
import DeliveryModal from '../components/organisms/pickup/DeliveryModal'
import PickupCard from '../components/organisms/pickup/PickupCard'
import { listarPickups, usePickupStore, type PedidoPickup } from '../store/pickup'

/** Fecha local `YYYY-MM-DD`, comparable con el valor de un input date. */
const diaLocal = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * F7: Entrega del Producto en Tienda Física / Pickup (RF-18, RF-19)
 * Asignado a: MAYLLE
 */
export default function PickupPage() {
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
    <div className="min-h-screen bg-[var(--color-surface-cloud)] p-6">
      <header className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--color-border-default)] bg-white p-5 shadow-sm">
        <Link to="/pos">
          <Button variant="secondary" className="gap-2">
            <IconArrowLeft size={18} /> Volver al POS
          </Button>
        </Link>
        <h1 className="font-heading text-2xl font-bold uppercase text-[var(--color-text-primary)]">Entregas en Tienda (Pickup)</h1>
        {pedidos && <Badge tone="brand">{listos.length} pendientes</Badge>}
      </header>

      <main className="flex flex-col gap-6">
        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Busca por DNI del comprador o código de pedido" />
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold">Fecha de arribo a tienda</span>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="rounded-xl border border-[var(--color-border-default)] bg-white px-4 py-3 shadow-sm"
            />
          </label>
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
          <p role="status" className="p-8 text-center text-sm text-[var(--color-text-secondary)]">
            Cargando pedidos…
          </p>
        ) : visibles.length === 0 ? (
          !noDisponible && (
            <EmptyState
              icon={<IconPackage size={24} />}
              title={listos.length === 0 ? 'Todo entregado' : 'Sin coincidencias'}
              description={
                listos.length === 0
                  ? 'No hay paquetes pendientes de recojo en esta tienda.'
                  : 'Ningún pedido listo para recojo coincide con la búsqueda.'
              }
            />
          )
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {visibles.map((pedido) => (
              <PickupCard key={pedido.pedidoId} pedido={pedido} destacado={!!termino} onProcesar={setEnEntrega} />
            ))}
          </ul>
        )}
      </main>

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
