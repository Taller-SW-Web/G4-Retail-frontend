import { useEffect, useState } from 'react'
import { IconCash, IconClockPause, IconPlayerPause, IconShoppingCart, IconTrash } from '@tabler/icons-react'
import { Button } from '../atoms/Button'
import { ConfirmDialog } from '../molecules/ConfirmDialog'
import { EmptyState } from '../molecules/EmptyState'
import { CartLine } from './CartLine'
import { CustomerSection } from './CustomerSection'
import { HeldCartsModal, HoldCartModal } from './HeldCarts'
import { PaymentModal } from './PaymentModal'
import { TotalsPanel } from './TotalsPanel'
import { eliminarCarritoEspera, listarCarritosEspera, pausarCarrito } from '../../services'
import { useCartStore } from '../../store/cart'
import { toast } from '../../store/toast'
import { calcularTotales, totalArticulos } from '../../lib/totals'
import type { CarritoEspera } from '../../types'

type Dialogo = 'pausar' | 'espera' | 'limpiar' | 'cobro' | null

/** RF-10 / RF-12: panel lateral del carrito de venta en mostrador. */
export function CartPanel() {
  const { items, cliente, vaciar, cargar } = useCartStore()
  const [dialogo, setDialogo] = useState<Dialogo>(null)
  const [enEspera, setEnEspera] = useState<CarritoEspera[]>([])

  useEffect(() => {
    listarCarritosEspera()
      .then(setEnEspera)
      .catch(() => {})
  }, [])

  const totales = calcularTotales(items)
  const prendas = totalArticulos(items)
  const bloqueo = items.length === 0 ? 'Agregue productos al carrito' : !cliente ? 'Asocie un cliente para proceder al cobro' : null

  async function pausar(alias: string) {
    try {
      const guardado = await pausarCarrito(alias, items, cliente)
      setEnEspera((lista) => [...lista, guardado])
      cargar([], null)
      setDialogo(null)
      toast.success(`Venta "${alias}" en espera. Mostrador listo para el siguiente cliente`)
    } catch {
      toast.error('No se pudo pausar la venta. Intenta nuevamente')
    }
  }

  async function reanudar(carrito: CarritoEspera) {
    try {
      await eliminarCarritoEspera(carrito.carritoEsperaId)
      setEnEspera((lista) => lista.filter((c) => c.carritoEsperaId !== carrito.carritoEsperaId))
      cargar(carrito.items, carrito.cliente)
      setDialogo(null)
    } catch {
      toast.error('No se pudo reanudar la venta. Intenta nuevamente')
    }
  }

  return (
    <aside aria-labelledby="titulo-carrito" className="flex flex-col gap-4 rounded-xl border border-border-default bg-white p-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="titulo-carrito" className="font-heading text-2xl font-bold uppercase">
            Carrito de Venta Mostrador
          </h2>
          <span className="text-sm font-semibold whitespace-nowrap text-text-secondary">
            {prendas} {prendas === 1 ? 'prenda' : 'prendas'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={<IconClockPause size={20} aria-hidden />} onClick={() => setDialogo('espera')}>
            Ventas en Espera ({enEspera.length})
          </Button>
          <Button variant="secondary" icon={<IconPlayerPause size={20} aria-hidden />} disabled={items.length === 0} onClick={() => setDialogo('pausar')}>
            Pausar Venta
          </Button>
        </div>
      </header>

      <CustomerSection />

      {items.length === 0 ? (
        <EmptyState icon={<IconShoppingCart size={24} />} title="Carrito vacío">
          Busca o escanea un producto para empezar la venta.
        </EmptyState>
      ) : (
        <>
          <ul className="divide-y divide-border-default border-y border-border-default">
            {items.map((item) => (
              <CartLine key={item.sku} item={item} />
            ))}
          </ul>
          <Button variant="danger" icon={<IconTrash size={20} aria-hidden />} onClick={() => setDialogo('limpiar')}>
            Limpiar Carrito
          </Button>
        </>
      )}

      <TotalsPanel totales={totales} />

      <div className="flex flex-col gap-1">
        <Button variant="confirm" size="lg" fullWidth disabled={!!bloqueo || totales.total <= 0} icon={<IconCash size={20} aria-hidden />} onClick={() => setDialogo('cobro')}>
          Proceder al Cobro
        </Button>
        {bloqueo && <p className="text-center text-xs text-text-secondary">{bloqueo}</p>}
      </div>

      {dialogo === 'pausar' && <HoldCartModal onClose={() => setDialogo(null)} onConfirm={pausar} />}
      {dialogo === 'espera' && (
        <HeldCartsModal carritos={enEspera} carritoOcupado={items.length > 0} onResume={reanudar} onClose={() => setDialogo(null)} />
      )}
      {dialogo === 'limpiar' && (
        <ConfirmDialog
          title="Limpiar carrito"
          confirmLabel="Limpiar Carrito"
          confirmVariant="danger"
          onCancel={() => setDialogo(null)}
          onConfirm={() => {
            vaciar()
            setDialogo(null)
          }}
        >
          ¿Desea vaciar todos los productos del carrito actual?
        </ConfirmDialog>
      )}
      {dialogo === 'cobro' && cliente && <PaymentModal totales={totales} onClose={() => setDialogo(null)} />}
    </aside>
  )
}
