import { Link } from 'react-router-dom'
import { IconArrowLeft } from '@tabler/icons-react'
import Button from '../components/atoms/Button'
import ActaGeneratorView from '../components/organisms/inventario/ActaGeneratorView'

/**
 * Actas de merma de la tienda (F12 · RF-34). Ruta `/inventario/actas`, solo para SUPERVISOR
 * (contrato §5.12).
 */
export default function MermasPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-cloud)] p-6">
      <header className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--color-border-default)] bg-white p-5 shadow-sm">
        <Link to="/pos">
          <Button variant="secondary" className="gap-2">
            <IconArrowLeft size={18} /> Volver al POS
          </Button>
        </Link>
        <h1 className="font-heading text-2xl font-bold uppercase text-[var(--color-text-primary)]">
          Liquidación de mermas
        </h1>
      </header>

      <main className="mx-auto max-w-5xl">
        <ActaGeneratorView />
      </main>
    </div>
  )
}
