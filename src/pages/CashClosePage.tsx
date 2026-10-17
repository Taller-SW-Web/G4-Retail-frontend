import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IconLogout, IconPrinter } from '@tabler/icons-react'
import Button from '../components/atoms/Button'
import Alert from '../components/molecules/Alert'
import ConfirmDialog from '../components/molecules/ConfirmDialog'
import DenominationCounter, { totalConteo, type Conteo } from '../components/organisms/caja/DenominationCounter'
import CashMovementModal from '../components/organisms/caja/CashMovementModal'
import ZReport from '../components/organisms/caja/ZReport'
import { cerrarTurno, type ReporteZResponse } from '../api/caja'
import { useAuthStore } from '../store/authStore'
import { useCajaStore } from '../store/caja'
import { formatCurrency } from '../lib/format'

interface Resultado {
  reporte: ReporteZResponse
  fechaHora: string
}

/**
 * Cierre de turno con arqueo ciego y Reporte Z (RF-22).
 *
 * El arqueo es ciego de verdad: en toda la pantalla no aparece el saldo que el sistema espera, solo
 * lo que el cajero va contando. La comparación ocurre del lado del backend al enviar el conteo, y
 * recién entonces se muestra el resultado. Enseñarlo antes invalidaría el control.
 */
export default function CashClosePage() {
  const perfil = useAuthStore((store) => store.perfil)
  const nombre = useAuthStore((store) => store.nombre)
  const salir = useAuthStore((store) => store.salir)
  const caja = useCajaStore((store) => store.caja)
  const setCaja = useCajaStore((store) => store.setCaja)
  const setUltimoReporteZ = useCajaStore((store) => store.setUltimoReporteZ)

  const [conteo, setConteo] = useState<Conteo>({})
  const [observaciones, setObservaciones] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [cerrando, setCerrando] = useState(false)
  const [error, setError] = useState(false)
  const [registrandoMovimiento, setRegistrandoMovimiento] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  const total = totalConteo(conteo)

  async function cerrar() {
    const turnoId = caja?.turnoId
    setCerrando(true)
    setError(false)
    try {
      if (!turnoId) {
        setError(true)
        return
      }
      const reporte = await cerrarTurno(turnoId, total, observaciones.trim())
      setResultado({ reporte, fechaHora: new Date().toISOString() })
      setUltimoReporteZ(reporte)
      setCaja({ estado: 'CERRADA' })
      // Nota de integración: aquí el prototipo reiniciaba el carrito. Cuando F4/F5 publiquen su
      // store de venta, hay que llamar a su "nueva venta" desde este punto.
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
          reporte={resultado.reporte}
          cajero={nombre ?? perfil?.codigoVendedor ?? '—'}
          tiendaId={perfil?.tiendaId ?? '—'}
          fechaHora={resultado.fechaHora}
          observaciones={observaciones.trim()}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center print:hidden">
          <Button onClick={() => window.print()}>
            <IconPrinter size={20} aria-hidden /> Imprimir Reporte Z
          </Button>
          <Button variant="outline" onClick={salir}>
            <IconLogout size={20} aria-hidden /> Cerrar sesión / Salir
          </Button>
        </div>
      </div>
    )
  }

  if (caja?.estado !== 'ABIERTA') {
    return (
      <div className="mx-auto max-w-xl">
        <Alert tono="info" title="No hay un turno de caja abierto en esta terminal">
          <Link to="/pos" className="font-semibold underline">
            Ir a la venta para abrir un turno
          </Link>
        </Alert>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-[32px] leading-10 font-bold uppercase">Cierre de turno</h1>
        <p className="text-text-secondary">
          Cuenta el efectivo de la gaveta e ingresa la cantidad de cada denominación.
        </p>
      </div>

      {error && (
        <Alert tono="error" title="No se pudo cerrar la caja">
          Tu conteo sigue en pantalla. Intenta nuevamente.
        </Alert>
      )}

      <section className="flex flex-col gap-4 rounded-xl border border-border-default bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-xl font-bold uppercase">Movimientos de caja chica</h2>
          <p className="text-sm text-text-secondary">
            Registra ingresos o egresos menores antes de cerrar el turno. Todo egreso exige la
            autorización de un supervisor (RF-21).
          </p>
        </div>
        {aviso && <Alert tono="success">{aviso}</Alert>}
        <div>
          <Button variant="outline" onClick={() => setRegistrandoMovimiento(true)}>
            Registrar movimiento
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-6 rounded-xl border border-border-default bg-white p-4 sm:p-6">
        <DenominationCounter conteo={conteo} onChange={setConteo} />

        <div className="flex items-baseline justify-between gap-4 rounded-lg bg-surface-cloud-subtle p-4" role="status">
          <span className="text-sm font-semibold">Total efectivo recontado</span>
          <span className="text-xl font-bold tabular-nums">{formatCurrency(total)}</span>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="observaciones" className="text-sm font-semibold">
            Observaciones del cajero (opcional)
          </label>
          <textarea
            id="observaciones"
            rows={3}
            maxLength={300}
            value={observaciones}
            onChange={(evento) => setObservaciones(evento.target.value)}
            className="rounded-lg border border-border-default bg-white px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-accent-signal focus:outline-none"
          />
        </div>

        <Button onClick={() => setConfirmando(true)}>Confirmar y cerrar caja</Button>
      </section>

      {confirmando && (
        <ConfirmDialog
          title="Cerrar caja"
          confirmLabel="Confirmar y cerrar caja"
          loading={cerrando}
          onCancel={() => setConfirmando(false)}
          onConfirm={cerrar}
        >
          Esta acción cerrará su turno y no permitirá más ventas en este terminal. Total declarado:{' '}
          {formatCurrency(total)}.
        </ConfirmDialog>
      )}

      {registrandoMovimiento && (
        <CashMovementModal
          onCerrar={() => setRegistrandoMovimiento(false)}
          onRegistrado={(nuevoSaldo) =>
            setAviso(`Movimiento registrado. Efectivo estimado en gaveta: ${formatCurrency(nuevoSaldo)}.`)
          }
        />
      )}
    </div>
  )
}
