import { useState, type FormEvent } from 'react'
import Button from '../../atoms/Button'
import Alert from '../../molecules/Alert'
import Modal from '../../molecules/Modal'
import { ApiError } from '../../../api/http'
import { registrarMovimiento, type TipoMovimientoCaja } from '../../../api/caja'
import { useCajaStore } from '../../../store/caja'
import { formatCurrency } from '../../../lib/format'

const FORM_ID = 'movimiento-caja'

interface CashMovementModalProps {
  onCerrar: () => void
  /** Se invoca con el saldo estimado en gaveta después del movimiento. */
  onRegistrado?: (nuevoSaldoEstimado: number) => void
}

/**
 * Ingreso o egreso menor de caja chica (RF-21).
 *
 * El movimiento se registra **contra el turno abierto** (`/caja/turnos/{turnoId}/movimientos`), que
 * es lo que ata el gasto a la caja y al responsable de ese turno: no hay forma de girar plata de un
 * turno ajeno o ya cerrado.
 *
 * El egreso exige autorización: la tabla pide registrar quién lo aprobó
 * (`autorizadoPor`), porque sale efectivo de la gaveta. Si el monto supera el efectivo
 * disponible, el backend responde `422` y aquí se explica sin perder lo que el cajero escribió.
 */
export default function CashMovementModal({ onCerrar, onRegistrado }: CashMovementModalProps) {
  const turnoId = useCajaStore((store) => store.caja?.turnoId)

  const [tipo, setTipo] = useState<TipoMovimientoCaja>('SALIDA_GASTO')
  const [monto, setMonto] = useState('')
  const [motivo, setMotivo] = useState('')
  const [autorizadoPor, setAutorizadoPor] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const valor = Number(monto)
  const valido = monto !== '' && Number.isFinite(valor) && valor > 0 && motivo.trim() !== '' && autorizadoPor.trim() !== ''

  async function registrar(evento: FormEvent) {
    evento.preventDefault()
    if (!valido || enviando) return

    setEnviando(true)
    setError(null)
    try {
      if (!turnoId) {
        setError('No hay un turno de caja abierto en esta terminal.')
        setEnviando(false)
        return
      }

      const respuesta = await registrarMovimiento(turnoId, {
        tipoMovimiento: tipo,
        monto: valor,
        motivo: motivo.trim(),
        autorizadoPor: autorizadoPor.trim(),
      })
      onRegistrado?.(respuesta.nuevoSaldoEstimado)
      onCerrar()
    } catch (fallo) {
      setError(mensajeDe(fallo))
      setEnviando(false)
    }
  }

  return (
    <Modal
      title={tipo === 'SALIDA_GASTO' ? 'Registrar egreso de caja' : 'Registrar ingreso de caja'}
      onClose={enviando ? undefined : onCerrar}
      footer={
        <>
          <Button variant="secondary" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} disabled={!valido || enviando}>
            {enviando ? 'Registrando…' : 'Registrar movimiento'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={registrar} noValidate className="flex flex-col gap-4">
        {error && <Alert tono="error" title="No se pudo registrar el movimiento">{error}</Alert>}

        <label className="flex flex-col gap-1 text-sm font-semibold">
          Tipo de movimiento
          <select
            value={tipo}
            onChange={(evento) => setTipo(evento.target.value as TipoMovimientoCaja)}
            className="rounded-lg border border-border-default bg-white px-4 py-2 font-normal focus:border-transparent focus:ring-2 focus:ring-accent-signal focus:outline-none"
          >
            <option value="SALIDA_GASTO">Egreso (gasto de caja chica)</option>
            <option value="INGRESO_MENOR">Ingreso (reposición de sencillo)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold">
          Monto
          <input
            type="number"
            inputMode="decimal"
            step="0.10"
            min={0}
            autoFocus
            placeholder="0.00"
            value={monto}
            onChange={(evento) => setMonto(evento.target.value)}
            className="rounded-lg border border-border-default bg-white px-4 py-2 font-normal focus:border-transparent focus:ring-2 focus:ring-accent-signal focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold">
          Motivo
          <textarea
            rows={2}
            maxLength={300}
            placeholder="Compra de rollos de papel térmico para tickets"
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
            className="rounded-lg border border-border-default bg-white px-4 py-2 font-normal focus:border-transparent focus:ring-2 focus:ring-accent-signal focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold">
          Autorizado por
          <input
            maxLength={100}
            placeholder="Supervisor Juan"
            value={autorizadoPor}
            onChange={(evento) => setAutorizadoPor(evento.target.value)}
            className="rounded-lg border border-border-default bg-white px-4 py-2 font-normal focus:border-transparent focus:ring-2 focus:ring-accent-signal focus:outline-none"
          />
        </label>

        <p className="text-xs text-text-secondary">
          Un egreso no puede superar el efectivo disponible en gaveta. El importe se registra en el
          historial del turno para la auditoría.
        </p>

        {valor > 0 && tipo === 'SALIDA_GASTO' && (
          <p className="text-xs text-text-secondary">Se descontarán {formatCurrency(valor)} de la gaveta.</p>
        )}
      </form>
    </Modal>
  )
}

function mensajeDe(fallo: unknown): string {
  if (fallo instanceof ApiError) {
    if (fallo.codigo === 'FONDOS_INSUFICIENTES_EN_GAVETA') {
      return 'El efectivo en gaveta no alcanza para ese egreso. Registra un ingreso o reduce el monto.'
    }
    if (fallo.codigo === 'TURNO_NO_ENCONTRADO') return 'No hay un turno de caja abierto en esta terminal.'
    if (fallo.codigo === 'TURNO_YA_CERRADO') return 'El turno ya fue cerrado y no admite más movimientos.'
    if (fallo.codigo === 'FORBIDDEN_TURNO_DE_OTRA_TIENDA') return 'El turno pertenece a otra tienda.'
    if (fallo.sinConexion) return 'No se pudo contactar al servidor. Revisa tu conexión.'
  }
  return 'Ocurrió un error inesperado. Intenta nuevamente.'
}
