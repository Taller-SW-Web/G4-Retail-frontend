import { IconArrowLeft, IconPackage } from '@tabler/icons-react'
import Button from '../components/atoms/Button'
import { Link } from 'react-router-dom'

/**
 * F7: Entrega del Producto en Tienda Física / Pickup (RF-18, RF-19)
 * Asignado a: MAYLLE
 */
export default function PickupPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-cloud)] p-6">
      <header className="mb-6 flex items-center justify-between rounded-2xl border border-[var(--color-border-default)] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/pos">
            <Button variant="secondary" className="gap-2">
              <IconArrowLeft size={18} /> Volver al POS
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <IconPackage className="text-[var(--color-accent-blue)]" size={24} />
              <h1 className="font-heading text-2xl uppercase text-[var(--color-text-primary)]">
                Bandeja de Entrega Pickup (Click & Collect)
              </h1>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              F7: Consulta de pedidos arribados a tienda y registro de entrega con DNI / firma (RF-18, RF-19)
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[var(--color-surface-cloud-subtle)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]">
          Responsable: Maylle
        </span>
      </header>

      <main className="rounded-2xl border border-dashed border-[var(--color-border-default)] bg-white p-12 text-center shadow-sm">
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface-cloud-subtle)] text-[var(--color-accent-blue)]">
            <IconPackage size={32} />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            Área de Trabajo de F7 — Pickup
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Aquí se integran <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">PickupCard.tsx</code> y <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">DeliveryModal.tsx</code> desde <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">components/organisms/pickup/</code>.
          </p>
        </div>
      </main>
    </div>
  )
}
