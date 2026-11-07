import { IconShirtSport } from '@tabler/icons-react'
import type { DetallePedido } from '../../../api/pedidoApi'
import { formatCurrency } from '../../../lib/format'
import { etiquetaCanal, formatFechaHoraLima, prendaDelCatalogo } from '../../../lib/pedidos'
import OrderStatusBadge from './OrderStatusBadge'

const Dato = ({ titulo, valor }: { titulo: string; valor?: string }) => (
  <div className="min-w-0">
    <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">{titulo}</dt>
    <dd className="truncate text-sm text-[var(--color-text-primary)]">{valor || '—'}</dd>
  </div>
)

/**
 * Cabecera y prendas del pedido (RF-17): código, canal, estado, fecha, tienda, cliente y el desglose
 * de prendas con foto, talla, color y precio. Lo que Ventas aún no envía (foto, talla, color) se
 * completa con el catálogo de la tienda por SKU.
 */
export default function OrderTrackingCard({ pedido }: { pedido: DetallePedido }) {
  const documento = pedido.cliente?.numeroDocumento
    ? `${pedido.cliente.tipoDocumento ?? 'Doc.'} ${pedido.cliente.numeroDocumento}`
    : undefined

  return (
    <section aria-label="Datos del pedido" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-lg font-bold text-[var(--color-text-primary)]">{pedido.pedidoId}</span>
        <OrderStatusBadge estado={pedido.estadoComercial} />
        <span className="rounded-full bg-[var(--color-surface-cloud-subtle)] px-2.5 py-1 text-xs font-semibold">
          {etiquetaCanal(pedido.canal)}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Dato titulo="Fecha" valor={formatFechaHoraLima(pedido.fechaCreacion)} />
        <Dato titulo="Tienda" valor={pedido.tiendaId} />
        <Dato titulo="Pago" valor={pedido.metodoPago} />
        <Dato titulo="Cliente" valor={pedido.cliente?.nombre} />
        <Dato titulo="Documento" valor={documento} />
        <Dato titulo="Total" valor={pedido.total !== undefined ? formatCurrency(pedido.total) : undefined} />
      </dl>

      <div className="relative overflow-x-auto rounded-xl border [contain:inline-size] border-[var(--color-border-default)]">
        <table className="w-full min-w-[520px] text-left text-sm">
          <caption className="sr-only">Prendas del pedido</caption>
          <thead className="bg-[var(--color-surface-cloud-subtle)] text-xs uppercase text-[var(--color-text-secondary)]">
            <tr>
              <th scope="col" className="px-3 py-2">Prenda</th>
              <th scope="col" className="px-3 py-2">Talla / Color</th>
              <th scope="col" className="px-3 py-2 text-right">Cant.</th>
              <th scope="col" className="px-3 py-2 text-right">Precio</th>
              <th scope="col" className="px-3 py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {pedido.lineas.map((linea) => {
              const catalogo = prendaDelCatalogo(linea.sku)
              const talla = linea.talla ?? catalogo.talla
              const color = linea.color ?? catalogo.color
              return (
                <tr key={linea.sku} className="border-t border-[var(--color-border-default)]">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      {catalogo.imagen ? (
                        <img src={catalogo.imagen} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-cloud-subtle)] text-[var(--color-text-secondary)]">
                          <IconShirtSport size={20} />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold">{linea.nombre ?? linea.sku}</p>
                        <p className="font-mono text-xs text-[var(--color-text-secondary)]">{linea.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">{[talla, color].filter(Boolean).join(' · ') || '—'}</td>
                  <td className="px-3 py-2 text-right">{linea.cantidad}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    {linea.precioUnitario !== undefined ? formatCurrency(linea.precioUnitario) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-semibold">
                    {linea.subtotal !== undefined ? formatCurrency(linea.subtotal) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
