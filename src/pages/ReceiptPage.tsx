import { IconArrowLeft, IconReceipt2 } from '@tabler/icons-react'
import Button from '../components/atoms/Button'
import { Link } from 'react-router-dom'

/**
 * F5: Comprobante y Boleta Electrónica de Venta (RF-13, RF-14, RF-15)
 * Asignado a: MIGUEL
 */
export default function ReceiptPage() {
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
              <IconReceipt2 className="text-[var(--color-accent-volt)]" size={24} />
              <h1 className="font-heading text-2xl uppercase text-[var(--color-text-primary)]">
                Comprobante Electrónico (Boleta B001)
              </h1>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              F5: Visualización de ticket térmico de 80mm con correlativo y QR (RF-13, RF-14, RF-15)
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[var(--color-surface-cloud-subtle)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]">
          Responsable: Miguel
        </span>
      </header>

      <main className="rounded-2xl border border-dashed border-[var(--color-border-default)] bg-white p-12 text-center shadow-sm">
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface-cloud-subtle)] text-[var(--color-accent-volt)]">
            <IconReceipt2 size={32} />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            Área de Trabajo de F5 — Boleta y Comprobante
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Aquí se integra <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">Receipt.tsx</code> desde <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">components/organisms/cobro/</code>.
          </p>
        </div>
      </main>
    </div>
  )
}
