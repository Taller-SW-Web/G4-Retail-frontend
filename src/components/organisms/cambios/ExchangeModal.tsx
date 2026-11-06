import { useState } from 'react'
import { IconPrinter } from '@tabler/icons-react'
import Button from '../../atoms/Button'
import Alert from '../../molecules/Alert'
import Modal from '../../molecules/Modal'
import VoucherThermalTicket from './VoucherThermalTicket'
import { ApiError } from '../../../api/http'
import {
  registrarCambio,
  type CambioRegistrado,
  type InspeccionPrenda,
  type ItemCambiable,
  type MotivoCambio,
} from '../../../api/cambiosApi'
import { evaluarInspeccion, MOTIVOS } from '../../../lib/inspeccion'
import { formatCurrency } from '../../../lib/format'

interface ExchangeModalProps {
  boletaNumero: string
  item: ItemCambiable
  /** El cambio quedó registrado: la pantalla debe actualizar las unidades disponibles. */
  onCambioRegistrado: (cambio: CambioRegistrado, cantidad: number) => void
  onClose: () => void
}

const CHECKLIST: { campo: keyof InspeccionPrenda; etiqueta: string }[] = [
  { campo: 'etiquetasIntactas', etiqueta: 'Etiquetas colgantes originales intactas' },
  { campo: 'sinSignosUso', etiqueta: 'Prenda limpia y sin signos de uso' },
  { campo: 'empaqueOriginal', etiqueta: 'Empaque o caja original apta' },
]

/**
 * Inspección física de la prenda y emisión del vale (F9 · RF-24 y RF-25).
 *
 * El botón "Aprobar cambio" se bloquea mientras falte una condición crítica de un cambio ordinario,
 * como pide el RF-24. Al aprobar, muestra el vale térmico listo para imprimir.
 */
export default function ExchangeModal({ boletaNumero, item, onCambioRegistrado, onClose }: ExchangeModalProps) {
  const [motivo, setMotivo] = useState<MotivoCambio>('CAMBIO_TALLA')
  const [cantidad, setCantidad] = useState(1)
  const [inspeccion, setInspeccion] = useState<InspeccionPrenda>({
    etiquetasIntactas: false,
    sinSignosUso: false,
    empaqueOriginal: false,
  })
  // Una clave por intento de cambio: si la red se corta y se reintenta, no se emiten dos vales.
  const [claveIdempotencia] = useState(() => crypto.randomUUID())
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registrado, setRegistrado] = useState<CambioRegistrado | null>(null)

  const evaluacion = evaluarInspeccion(motivo, inspeccion)
  const monto = item.precioPagado * cantidad

  const aprobar = async () => {
    setProcesando(true)
    setError(null)
    try {
      const cambio = await registrarCambio(
        { boletaNumero, sku: item.sku, cantidad, motivo, inspeccion },
        claveIdempotencia,
      )
      setRegistrado(cambio)
      onCambioRegistrado(cambio, cantidad)
    } catch (causa) {
      setError(causa instanceof ApiError ? causa.message : 'No se pudo registrar el cambio. Intenta de nuevo.')
    } finally {
      setProcesando(false)
    }
  }

  if (registrado) {
    return (
      <Modal
        title="Vale emitido"
        onClose={onClose}
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
            <Button className="gap-2" onClick={() => window.print()}>
              <IconPrinter size={18} /> Imprimir vale
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {registrado.observaciones.length > 0 && (
            <Alert tono="info" title="Observaciones de la inspección">
              {registrado.observaciones.join(' · ')}
            </Alert>
          )}
          <VoucherThermalTicket vale={registrado.vale} />
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      title="Inspección de la prenda"
      onClose={procesando ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={procesando}>
            Cancelar
          </Button>
          <Button onClick={aprobar} disabled={!evaluacion.puedeAprobar || procesando}>
            {procesando ? 'Registrando…' : `Aprobar cambio y emitir vale de ${formatCurrency(monto)}`}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div>
          <p className="font-semibold text-[var(--color-text-primary)]">{item.descripcion}</p>
          <p className="font-mono text-xs text-[var(--color-text-secondary)]">
            {item.sku} · {formatCurrency(item.precioPagado)} c/u · boleta {boletaNumero}
          </p>
        </div>

        <fieldset>
          <legend className="mb-2 font-semibold">Motivo del cambio</legend>
          <div className="flex flex-wrap gap-2">
            {MOTIVOS.map((opcion) => (
              <label
                key={opcion.valor}
                className={`cursor-pointer rounded-lg border px-3 py-2 ${
                  motivo === opcion.valor
                    ? 'border-[var(--color-accent-signal)] bg-[var(--color-accent-signal-soft)] font-semibold'
                    : 'border-[var(--color-border-default)]'
                }`}
              >
                <input
                  type="radio"
                  name="motivo"
                  value={opcion.valor}
                  checked={motivo === opcion.valor}
                  onChange={() => setMotivo(opcion.valor)}
                  className="sr-only"
                />
                {opcion.etiqueta}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex items-center gap-3">
          <span className="font-semibold">Unidades</span>
          <input
            type="number"
            min={1}
            max={item.cantidadDisponibleCambio}
            value={cantidad}
            onChange={(evento) =>
              setCantidad(Math.min(item.cantidadDisponibleCambio, Math.max(1, Number(evento.target.value) || 1)))
            }
            className="w-20 rounded-lg border border-[var(--color-border-default)] px-3 py-1.5"
          />
          <span className="text-xs text-[var(--color-text-secondary)]">
            de {item.cantidadDisponibleCambio} disponibles
          </span>
        </label>

        <fieldset>
          <legend className="mb-2 font-semibold">Estado físico de la prenda</legend>
          <div className="space-y-2">
            {CHECKLIST.map(({ campo, etiqueta }) => (
              <label key={campo} className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={inspeccion[campo]}
                  onChange={(evento) => setInspeccion((actual) => ({ ...actual, [campo]: evento.target.checked }))}
                  className="h-4 w-4"
                />
                {etiqueta}
              </label>
            ))}
          </div>
        </fieldset>

        {evaluacion.porGarantia && (
          <Alert tono="info">Falla de fábrica: se aprueba por garantía y la prenda va a merma, no a la venta.</Alert>
        )}
        {!evaluacion.puedeAprobar && (
          <Alert tono="warning" title="No se puede aprobar el cambio">
            Falta: {evaluacion.faltantes.join(' · ')}
          </Alert>
        )}
        {error && <Alert tono="error">{error}</Alert>}
      </div>
    </Modal>
  )
}
