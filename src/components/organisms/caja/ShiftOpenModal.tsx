import { useEffect, useState, type FormEvent } from 'react'
import Button from '../../atoms/Button'
import Alert from '../../molecules/Alert'
import Modal from '../../molecules/Modal'
import DenominationCounter, { totalConteo, type Conteo } from './DenominationCounter'
import { ApiError } from '../../../api/http'
import { TERMINAL_POS, abrirTurno, turnoActual } from '../../../api/caja'
import { useAuthStore } from '../../../store/authStore'
import { useCajaStore } from '../../../store/caja'
import { formatFechaHora } from '../../../lib/format'

const FORM_ID = 'apertura-turno'

/**
 * Apertura obligatoria del turno con fondo fijo (RF-20).
 *
 * Es el primer muro del mostrador: sin turno abierto no se vende. Por eso el modal se monta **sin
 * `onClose`**, porque no hay "después": la única salida es abrir el turno o cerrar la sesión para
 * que entre otra persona.
 *
 * El fondo se puede teclear de una vez o construirse contando monedas y billetes, que es lo que
 * pasa en la práctica; en ese caso el monto se calcula solo y queda de solo lectura.
 */
export default function ShiftOpenModal() {
  const perfil = useAuthStore((store) => store.perfil)
  const nombre = useAuthStore((store) => store.nombre)
  const salir = useAuthStore((store) => store.salir)
  const setCaja = useCajaStore((store) => store.setCaja)

  const [monto, setMonto] = useState('')
  const [conteo, setConteo] = useState<Conteo | null>(null)
  const [abriendo, setAbriendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    const reloj = setInterval(() => setAhora(new Date()), 30_000)
    return () => clearInterval(reloj)
  }, [])

  if (!perfil) return null

  const cajero = nombre ?? perfil.codigoVendedor
  const valor = Number(monto)
  const negativo = monto !== '' && valor < 0
  const valido = monto !== '' && Number.isFinite(valor) && valor >= 0

  async function abrir(evento: FormEvent) {
    evento.preventDefault()
    if (!valido || abriendo) return

    setAbriendo(true)
    setError(null)
    try {
      await abrirTurno(valor, TERMINAL_POS)
    } catch (fallo) {
      if (fallo instanceof ApiError && fallo.status === 409) {
        setError('La terminal ya cuenta con un turno abierto. Debe cerrarlo antes de iniciar uno nuevo.')
      } else {
        setError('No se pudo abrir el turno. Intenta nuevamente.')
      }
      setAbriendo(false)
      return
    }

    // El turno quedó abierto: se refleja en el store y el modal desaparece.
    const turno = await turnoActual().catch(() => ({
      estado: 'ABIERTA' as const,
      terminalPos: TERMINAL_POS,
      cajero,
    }))
    setCaja(turno)
  }

  return (
    <Modal
      title="Apertura de Turno de Caja"
      footer={
        <>
          <Button variant="secondary" onClick={salir} disabled={abriendo}>
            Cerrar sesión
          </Button>
          <Button type="submit" form={FORM_ID} disabled={!valido || abriendo}>
            {abriendo ? 'Abriendo…' : 'Confirmar apertura'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={abrir} noValidate className="flex flex-col gap-6">
        {error && <Alert tono="error" title="No se pudo abrir el turno">{error}</Alert>}

        <p className="text-sm text-text-secondary">
          Cajero responsable: <span className="font-semibold text-text-primary">{cajero}</span> · {TERMINAL_POS} ·{' '}
          {formatFechaHora(ahora)}
        </p>

        <label className="flex flex-col gap-1 text-sm font-semibold">
          Fondo fijo inicial
          <input
            type="number"
            inputMode="decimal"
            step="0.10"
            min={0}
            autoFocus
            placeholder="200.00"
            value={monto}
            readOnly={!!conteo}
            onChange={(evento) => setMonto(evento.target.value)}
            aria-invalid={negativo || undefined}
            className="rounded-lg border border-border-default bg-white px-4 py-2 font-normal focus:border-transparent focus:ring-2 focus:ring-accent-signal focus:outline-none"
          />
          {negativo ? (
            <span role="alert" className="text-xs font-normal text-error">
              El monto no puede ser negativo
            </span>
          ) : (
            <span className="text-xs font-normal text-text-secondary">
              Sencillo con el que inicia la gaveta de esta terminal.
            </span>
          )}
        </label>

        {conteo ? (
          <DenominationCounter
            conteo={conteo}
            monedas={[1, 2, 5]}
            billetes={[10, 20, 50, 100]}
            onChange={(nuevo) => {
              setConteo(nuevo)
              setMonto(totalConteo(nuevo).toFixed(2))
            }}
          />
        ) : (
          <div>
            <Button variant="outline" onClick={() => setConteo({})}>
              Contar por denominaciones
            </Button>
          </div>
        )}
      </form>
    </Modal>
  )
}
