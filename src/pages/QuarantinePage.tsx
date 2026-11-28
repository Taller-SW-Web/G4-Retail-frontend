import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IconAlertTriangle, IconArrowLeft, IconRefresh } from '@tabler/icons-react'
import Button from '../components/atoms/Button'
import DiscrepancyModal from '../components/organisms/inventario/DiscrepancyModal'
import QuarantineList from '../components/organisms/inventario/QuarantineList'
import { useCuarentena } from '../hooks/useCuarentena'
import type { Product } from '../types'

type QuarantinePageProps = {
  /** Catálogo completo de la tienda, para identificar la prenda que se reporta. */
  products: Product[]
}

/**
 * F12: Artículos en cuarentena de la tienda (RF-32, RF-33). Ruta `/cuarentena`.
 * Asignado a: ANGIE
 *
 * Lista las prendas retenidas que aún no salieron con un acta de merma y permite reportar una nueva.
 * La emisión del acta (RF-34) parte de esta misma bandeja.
 */
export default function QuarantinePage({ products }: QuarantinePageProps) {
  const { items, cargando, error, recargar } = useCuarentena()
  const [reportando, setReportando] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--color-surface-cloud)] p-4 md:p-6">
      <header className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--color-border-default)] bg-white p-5 shadow-sm">
        <Link to="/pos">
          <Button variant="secondary" className="gap-2">
            <IconArrowLeft size={20} aria-hidden="true" /> Volver al POS
          </Button>
        </Link>
        <h1 className="font-heading text-2xl font-bold uppercase text-[var(--color-text-primary)]">
          Artículos en cuarentena
        </h1>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => void recargar()} disabled={cargando}>
            <IconRefresh size={16} aria-hidden="true" /> Actualizar
          </Button>
          <Button variant="primary" className="gap-2" onClick={() => setReportando(true)}>
            <IconAlertTriangle size={16} aria-hidden="true" /> Reportar incidencia
          </Button>
        </div>
      </header>

      <main className="rounded-2xl border border-[var(--color-border-default)] bg-white p-5 shadow-sm">
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          Prendas dañadas o no ubicadas, bloqueadas para la venta hasta que salgan de la tienda con un acta de merma.
        </p>
        <QuarantineList items={items} cargando={cargando} error={error} />
      </main>

      {reportando && (
        <DiscrepancyModal products={products} onClose={() => setReportando(false)} onReportada={() => void recargar()} />
      )}
    </div>
  )
}
