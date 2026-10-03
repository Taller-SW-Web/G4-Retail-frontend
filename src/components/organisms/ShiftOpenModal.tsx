import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../atoms/Button'
import { Alert } from '../molecules/Alert'
import { FormField } from '../molecules/FormField'
import { Modal } from '../molecules/Modal'
import { DenominationCounter, totalConteo, type Conteo } from './DenominationCounter'
import { ApiError } from '../../api/http'
import { TERMINAL_POS, abrirCaja, estadoCaja } from '../../services'
import { useAuthStore } from '../../store/auth'
import { useCajaStore } from '../../store/caja'
import { toast } from '../../store/toast'
import { formatFechaHora } from '../../lib/format'

const FORM_ID = 'apertura-turno'

/** RF-20: apertura obligatoria del turno con fondo fijo; no se puede descartar. */
export function ShiftOpenModal() {
  const usuario = useAuthStore((s) => s.usuario)!
  const cerrarSesion = useAuthStore((s) => s.cerrarSesion)
  const setCaja = useCajaStore((s) => s.setCaja)
  const [monto, setMonto] = useState('')
  const [conteo, setConteo] = useState<Conteo | null>(null)
  const [abriendo, setAbriendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    const reloj = setInterval(() => setAhora(new Date()), 30_000)
    return () => clearInterval(reloj)
  }, [])

  const valor = Number(monto)
  const negativo = monto !== '' && valor < 0
  const valido = monto !== '' && Number.isFinite(valor) && valor >= 0

  async function abrir(e: FormEvent) {
    e.preventDefault()
    if (!valido || abriendo) return
    setAbriendo(true)
    setError(null)
    try {
      await abrirCaja(valor)
      toast.success('Turno de caja abierto')
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.warning('La terminal ya cuenta con un turno abierto')
      } else {
        setError('No se pudo abrir el turno. Intenta nuevamente')
        return setAbriendo(false)
      }
    }
    setCaja(await estadoCaja().catch(() => ({ estado: 'ABIERTA' as const, terminalPos: TERMINAL_POS, cajero: usuario.nombres })))
  }

  return (
    <Modal
      title="Apertura de Turno de Caja"
      footer={
        <>
          <Button variant="secondary" onClick={() => cerrarSesion()} disabled={abriendo}>
            Cerrar Sesión
          </Button>
          <Button type="submit" form={FORM_ID} disabled={!valido} loading={abriendo}>
            Confirmar Apertura
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={abrir} noValidate className="flex flex-col gap-6">
        {error && <Alert tono="error">{error}</Alert>}
        <p className="text-sm text-text-secondary">
          Cajero responsable:{' '}
          <span className="font-semibold text-text-primary">
            {usuario.nombres} {usuario.apellidos}
          </span>{' '}
          · {TERMINAL_POS} · {formatFechaHora(ahora)}
        </p>
        <FormField
          label="Fondo Fijo Inicial (S/)"
          type="number"
          inputMode="decimal"
          step="0.10"
          autoFocus
          placeholder="200.00"
          value={monto}
          readOnly={!!conteo}
          onChange={(e) => setMonto(e.target.value)}
          error={negativo ? 'El monto no puede ser negativo' : undefined}
          ayuda="Sencillo con el que inicia la gaveta de esta terminal."
        />
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
