import { useState } from 'react'
import { IconCash, IconClockPause, IconPlayerPause, IconShoppingCart, IconTrash } from '@tabler/icons-react'
import Button from '../../atoms/Button'
import ConfirmDialog from '../../molecules/ConfirmDialog'
import EmptyState from '../../molecules/EmptyState'
import CartLine from './CartLine'
import TotalsPanel from './TotalsPanel'
import { HeldCartsModal, HoldCartModal } from './HeldCarts'
import { calcularTotales, getCartItemCount } from '../../../lib/cart'
import { useCartStore } from '../../../store/cart'

type DialogoActivo = 'pausar' | 'espera' | 'limpiar' | null

interface CartPanelProps {
  items?: import('../../../types').CartItem[]
  subtotal?: number
  onIncrease?: (id: string) => void
  onDecrease?: (id: string) => void
  onRemove?: (id: string) => void
  onProceedToPayment?: () => void
}

/**
 * Panel lateral del carrito de compras en mostrador POS (F4 — RF-10, RF-11, RF-12).
 *
 * Funcionalidades:
 * - Listado reactivo de prendas en mostrador con validación de stock local.
 * - Suspensión de carritos para probadores (Hold/Resume).
 * - Cálculo consolidado con fórmulas fiscales SUNAT e IGV 18%.
 * - Habilitación condicionada del botón de cobro (F5).
 */
export default function CartPanel({ onProceedToPayment }: CartPanelProps) {
  const items = useCartStore((s) => s.items)
  const cupon = useCartStore((s) => s.cupon)
  const vaciarCarrito = useCartStore((s) => s.vaciarCarrito)
  const carritosEnEspera = useCartStore((s) => s.carritosEnEspera)

  const [dialogo, setDialogo] = useState<DialogoActivo>(null)

  const totales = calcularTotales(items, cupon)
  const totalPrendas = getCartItemCount(items)

  const puedeCobrar = items.length > 0 && totales.totalPagar > 0
  const motivoBloqueo = items.length === 0 ? 'Agregue productos del catálogo para habilitar el cobro' : null

  return (
    <aside className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border-default)] bg-white p-5 shadow-sm md:h-full md:min-h-0">
      {/* Encabezado */}
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl uppercase tracking-wide text-[var(--color-text-primary)]">
            Carrito de Venta
          </h2>
          <span className="rounded-full bg-[var(--color-surface-cloud-subtle)] px-2.5 py-1 text-xs font-bold text-[var(--color-text-primary)]">
            {totalPrendas} {totalPrendas === 1 ? 'prenda' : 'prendas'}
          </span>
        </div>

        {/* Barra de Acciones de Mostrador (RF-10) */}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setDialogo('espera')}
            className="gap-1.5 px-2.5 py-1.5 text-xs"
          >
            <IconClockPause size={16} />
            En Espera ({carritosEnEspera.length})
          </Button>

          <Button
            type="button"
            variant="secondary"
            disabled={items.length === 0}
            onClick={() => setDialogo('pausar')}
            className="gap-1.5 px-2.5 py-1.5 text-xs"
          >
            <IconPlayerPause size={16} />
            Pausar
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={items.length === 0}
            onClick={() => setDialogo('limpiar')}
            className="ml-auto gap-1.5 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            <IconTrash size={16} />
            Vaciar
          </Button>
        </div>
      </header>

      {/* Lista de Líneas */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <EmptyState
            icon={<IconShoppingCart size={28} className="text-[var(--color-text-secondary)]" />}
            title="Carrito vacío"
            description="Escanea o selecciona artículos del catálogo para iniciar la venta."
          />
        ) : (
          items.map((item) => (
            <CartLine key={item.product.id} item={item} />
          ))
        )}
      </div>

      {/* Resumen Financiero SUNAT (RF-11, RF-12) */}
      <TotalsPanel totales={totales} />

      {/* Botón Principal de Cobro */}
      <div className="space-y-1.5">
        <Button
          type="button"
          variant="primary"
          disabled={!puedeCobrar}
          onClick={onProceedToPayment}
          className="w-full gap-2 py-3 text-base font-bold uppercase tracking-wider"
        >
          <IconCash size={20} aria-hidden />
          Proceder al Cobro
        </Button>
        {motivoBloqueo && (
          <p className="text-center text-xs text-[var(--color-text-secondary)]">
            {motivoBloqueo}
          </p>
        )}
      </div>

      {/* Diálogos y Modales */}
      {dialogo === 'pausar' && (
        <HoldCartModal
          onClose={() => setDialogo(null)}
          onSuccess={() => setDialogo(null)}
        />
      )}

      {dialogo === 'espera' && (
        <HeldCartsModal
          onClose={() => setDialogo(null)}
          onResumed={() => setDialogo(null)}
        />
      )}

      {dialogo === 'limpiar' && (
        <ConfirmDialog
          title="Vaciar Carrito"
          confirmLabel="Vaciar Carrito"
          confirmVariant="primary"
          onCancel={() => setDialogo(null)}
          onConfirm={() => {
            vaciarCarrito()
            setDialogo(null)
          }}
        >
          ¿Desea retirar todas las prendas del carrito actual y liberar el mostrador?
        </ConfirmDialog>
      )}
    </aside>
  )
}
