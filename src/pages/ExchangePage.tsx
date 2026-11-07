import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { IconArrowLeft, IconBarcode, IconExchange } from '@tabler/icons-react'
import Badge from '../components/atoms/Badge'
import Button from '../components/atoms/Button'
import Alert from '../components/molecules/Alert'
import ExchangeModal from '../components/organisms/cambios/ExchangeModal'
import { useEnfoqueInicial } from '../hooks/useEnfoqueInicial'
import { ApiError } from '../api/http'
import {
  esBoletaValida,
  validarBoleta,
  type ItemCambiable,
  type ValidacionCambio,
} from '../api/cambiosApi'
import { formatCurrency, formatFechaHora } from '../lib/format'

/**
 * Cambios de prenda y vales de compra en mostrador (F9 · RF-23 a RF-25). Ruta `/cambios`.
 *
 * El vendedor escanea o escribe la boleta; la pantalla muestra si está en plazo y qué prendas se
 * pueden cambiar. Al elegir una, el modal guía la inspección física y emite el vale.
 */
export default function ExchangePage() {
  const [parametros] = useSearchParams()
  const [boleta, setBoleta] = useState(() => parametros.get('boleta') ?? '')
  const campoBoleta = useEnfoqueInicial<HTMLInputElement>()
  const [validacion, setValidacion] = useState<ValidacionCambio | null>(null)
  const [consultando, setConsultando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [itemEnCambio, setItemEnCambio] = useState<ItemCambiable | null>(null)

  const consultar = async (evento: FormEvent) => {
    evento.preventDefault()
    if (!esBoletaValida(boleta)) {
      setError('El comprobante debe tener el formato B001-00000045.')
      setValidacion(null)
      return
    }
    setConsultando(true)
    setError(null)
    try {
      setValidacion(await validarBoleta(boleta))
    } catch (causa) {
      setValidacion(null)
      setError(causa instanceof ApiError ? causa.message : 'No se pudo validar la boleta. Intenta de nuevo.')
    } finally {
      setConsultando(false)
    }
  }

  /** Tras emitir un vale, descuenta las unidades cambiadas sin volver a consultar. */
  const alRegistrarCambio = (sku: string, cantidad: number) => {
    setValidacion((actual) =>
      actual && {
        ...actual,
        items: actual.items.map((item) =>
          item.sku === sku
            ? { ...item, cantidadDisponibleCambio: Math.max(0, item.cantidadDisponibleCambio - cantidad) }
            : item,
        ),
      },
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-cloud)] p-6">
      <header className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--color-border-default)] bg-white p-5 shadow-sm">
        <Link to="/pos">
          <Button variant="secondary" className="gap-2">
            <IconArrowLeft size={18} /> Volver al POS
          </Button>
        </Link>
        <h1 className="font-heading text-2xl font-bold uppercase text-[var(--color-text-primary)]">
          Cambios y vales de compra
        </h1>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-6">
        <form
          onSubmit={consultar}
          className="flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-border-default)] bg-white p-5 shadow-sm"
        >
          <label className="flex min-w-64 flex-1 flex-col gap-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
              <IconBarcode size={18} /> Boleta o factura de la compra
            </span>
            <input
              ref={campoBoleta}
              value={boleta}
              onChange={(evento) => setBoleta(evento.target.value)}
              placeholder="B001-00000045"
              aria-label="Número de boleta"
              className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-cloud)] px-4 py-3 font-mono uppercase tracking-widest outline-none focus:border-[var(--color-accent-signal)] focus:ring-2 focus:ring-[var(--color-accent-signal-soft)]"
            />
          </label>
          <Button type="submit" className="px-6 py-3" disabled={consultando}>
            {consultando ? 'Validando…' : 'Validar boleta'}
          </Button>
        </form>

        {error && <Alert tono="error">{error}</Alert>}

        {validacion && (
          <section
            aria-label="Compra original"
            className="rounded-2xl border border-[var(--color-border-default)] bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-lg font-bold">{validacion.boletaNumero}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Emitida {formatFechaHora(validacion.fechaEmision)}
                  {validacion.pedidoId && ` · Pedido ${validacion.pedidoId}`}
                </p>
              </div>
              {validacion.plazoValido ? (
                <Badge tone="success">
                  Válido para cambio (día {validacion.diasTranscurridos} de {validacion.plazoDias})
                </Badge>
              ) : (
                <Badge tone="warning">Plazo expirado ({validacion.diasTranscurridos} días)</Badge>
              )}
            </div>

            {!validacion.plazoValido && (
              <Alert tono="warning" className="mb-4">
                El plazo de cambio es de {validacion.plazoDias} días y esta compra tiene{' '}
                {validacion.diasTranscurridos}. No se puede registrar el cambio.
              </Alert>
            )}

            <ul className="divide-y divide-[var(--color-border-default)]">
              {validacion.items.map((item) => {
                const agotado = item.cantidadDisponibleCambio === 0
                return (
                  <li key={item.sku} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-semibold">{item.descripcion}</p>
                      <p className="font-mono text-xs text-[var(--color-text-secondary)]">
                        {item.sku} · {formatCurrency(item.precioPagado)} c/u · {item.cantidadDisponibleCambio} de{' '}
                        {item.cantidadComprada} disponibles para cambio
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="gap-2"
                      disabled={!validacion.plazoValido || agotado}
                      onClick={() => setItemEnCambio(item)}
                    >
                      <IconExchange size={18} /> {agotado ? 'Ya cambiada' : 'Cambiar'}
                    </Button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </main>

      {validacion && itemEnCambio && (
        <ExchangeModal
          boletaNumero={validacion.boletaNumero}
          item={itemEnCambio}
          onCambioRegistrado={(_, cantidad) => alRegistrarCambio(itemEnCambio.sku, cantidad)}
          onClose={() => setItemEnCambio(null)}
        />
      )}
    </div>
  )
}
