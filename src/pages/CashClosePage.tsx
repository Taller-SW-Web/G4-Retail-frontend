import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IconLogout, IconPrinter } from '@tabler/icons-react'
import { Button } from '../components/atoms/Button'
import { Alert } from '../components/molecules/Alert'
import { ConfirmDialog } from '../components/molecules/ConfirmDialog'
import { DenominationCounter, totalConteo, type Conteo } from '../components/organisms/DenominationCounter'
import { ZReport } from '../components/organisms/ZReport'
import { cerrarCaja } from '../services'
import { useAuthStore } from '../store/auth'
import { useCajaStore } from '../store/caja'
import { useCartStore } from '../store/cart'
import { formatSoles } from '../lib/format'
import type { CierreCajaResponse } from '../types'

interface Resultado {
  cierre: CierreCajaResponse
  fechaHora: string
}

/** RF-22: arqueo ciego (sin mostrar el saldo esperado) y Reporte Z del turno. */
export function CashClosePage() {
  const usuario = useAuthStore((s) => s.usuario)!
  const cerrarSesion = useAuthStore((s) => s.cerrarSesion)
  const nuevaVenta = useCartStore((s) => s.nuevaVenta)
  const { caja, setCaja } = useCajaStore()
  const [conteo, setConteo] = useState<Conteo>({})
  const [observaciones, setObservaciones] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [cerrando, setCerrando] = useState(false)
  const [error, setError] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  const total = totalConteo(conteo)

  async function cerrar() {
    setCerrando(true)
    setError(false)
    try {
      const cierre = await cerrarCaja(total, observaciones.trim())
      setResultado({ cierre, fechaHora: new Date().toISOString() })
      setCaja({ estado: 'CERRADA' })
      nuevaVenta()
    } catch {
      setError(true)
    } finally {
      setCerrando(false)
      setConfirmando(false)
    }
  }

  if (resultado) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <h1 className="font-heading text-[32px] leading-10 font-bold uppercase print:hidden">Turno cerrado</h1>
        <ZReport
          cierre={resultado.cierre}
          cajero={`${usuario.nombres} ${usuario.apellidos}`}
          tiendaId={usuario.tiendaId}
          fechaHora={resultado.fechaHora}
          observaciones={observaciones.trim()}
        />
        <div className="flex flex-col gap-2 xs:flex-row xs:justify-center print:hidden">
          <Button size="lg" icon={<IconPrinter size={20} aria-hidden />} onClick={() => window.print()}>
            Imprimir Reporte Z
          </Button>
          <Button variant="outline" size="lg" icon={<IconLogout size={20} aria-hidden />} onClick={() => cerrarSesion()}>
            Cerrar Sesión / Salir
          </Button>
        </div>
      </div>
    )
  }

  if (caja?.estado !== 'ABIERTA') {
    return (
      <Alert tono="info" title="No hay un turno de caja abierto en esta terminal">
        <Link to="/pos" className="font-semibold underline">
          Ir a la venta para abrir un turno
        </Link>
      </Alert>
    )
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-[32px] leading-10 font-bold uppercase">Cierre de turno</h1>
        <p className="text-text-secondary">Cuenta el efectivo de la gaveta e ingresa la cantidad de cada denominación.</p>
      </div>
      {error && (
        <Alert tono="error" title="No se pudo cerrar la caja">
          Tu conteo sigue en pantalla. Intenta nuevamente.
        </Alert>
      )}
      <section className="flex flex-col gap-6 rounded-xl border border-border-default bg-white p-4 sm:p-6">
        <DenominationCounter conteo={conteo} onChange={setConteo} />
        <div className="flex items-baseline justify-between gap-4 rounded-lg bg-surface-cloud-subtle p-4" role="status">
          <span className="text-sm font-semibold">Total Efectivo Recontado</span>
          <span className="text-xl font-bold tabular-nums">{formatSoles(total)}</span>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="observaciones" className="text-sm font-semibold">
            Observaciones del Cajero (opcional)
          </label>
          <textarea
            id="observaciones"
            rows={3}
            maxLength={300}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="rounded-lg border border-border-default bg-white px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-accent-signal focus:outline-none"
          />
        </div>
        <Button variant="confirm" size="lg" onClick={() => setConfirmando(true)}>
          Confirmar y Cerrar Caja
        </Button>
      </section>

      {confirmando && (
        <ConfirmDialog
          title="Cerrar caja"
          confirmLabel="Confirmar y Cerrar Caja"
          confirmVariant="confirm"
          loading={cerrando}
          onCancel={() => setConfirmando(false)}
          onConfirm={cerrar}
        >
          Esta acción cerrará su turno y no permitirá más ventas en este terminal. Total declarado: {formatSoles(total)}.
        </ConfirmDialog>
      )}
    </div>
  )
}
