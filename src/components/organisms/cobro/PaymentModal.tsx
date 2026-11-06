import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCash, IconCreditCard, IconX } from '@tabler/icons-react'
import Button from '../../atoms/Button'
import { formatCurrency } from '../../../lib/format'
import { ApiError } from '../../../api/http'
import { registrarVenta, type MedioPago, type TipoComprobante, type VentaRequest } from '../../../api/ventas'
import type { VentaFinalizada } from './Receipt'

// RF-13 / RF-14: tipos de pago y comprobante
export type { MedioPago, TipoComprobante } from '../../../api/ventas'

export interface ClienteResumen {
  id: string
  nombre: string
  tipoDocumento: 'DNI' | 'RUC' | 'SIN_DOCUMENTO'
  numeroDocumento: string
}

export interface ItemVenta {
  sku: string
  nombre: string
  talla: string
  color: string
  cantidad: number
  precioUnitario: number
}

export interface PaymentModalProps {
  total: number
  cliente: ClienteResumen
  items: ItemVenta[]
  vendedor: string
  terminalPos: string
  turnoId: string
  cupon?: string
  onClose: () => void
  /** Callback al confirmar venta exitosa — recibe los datos para el comprobante */
  onVentaConfirmada: (datos: VentaFinalizada) => void
}

const MONTO_BOLETA_REQUIERE_DNI = 700
const BILLETES = [50, 100, 200]

/** RF-13 / RF-14 / RF-15: cobro presencial, tipo de comprobante y creación de la orden. */
export default function PaymentModal({
  total,
  cliente,
  items,
  vendedor,
  terminalPos,
  turnoId,
  cupon,
  onClose,
  onVentaConfirmada,
}: PaymentModalProps) {
  const navigate = useNavigate()
  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>('BOLETA')
  const [regalo, setRegalo] = useState(false)
  const [medio, setMedio] = useState<MedioPago>('EFECTIVO')
  const [recibido, setRecibido] = useState('')
  const [referencia, setReferencia] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [reintento, setReintento] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pendiente = useRef<{ clave: string; peticion: VentaRequest } | null>(null)
  const enCurso = useRef(false)

  const montoRecibido = Number(recibido)
  const vuelto = montoRecibido - total

  const pagoValido =
    medio === 'EFECTIVO' ? recibido !== '' && vuelto >= 0 : referencia.trim().length >= 4

  const errorComprobante =
    tipoComprobante === 'FACTURA' && cliente.tipoDocumento !== 'RUC'
      ? 'Para emitir Factura debe asociar un cliente con RUC corporativo'
      : tipoComprobante === 'BOLETA' &&
          total >= MONTO_BOLETA_REQUIERE_DNI &&
          cliente.tipoDocumento !== 'DNI'
        ? 'Por normativa SUNAT, ventas mayores o iguales a S/ 700.00 requieren identificar al cliente con su DNI'
        : null

  async function confirmar() {
    if (enCurso.current || (!pendiente.current && (!pagoValido || errorComprobante))) return
    enCurso.current = true
    setProcesando(true)
    setError(null)

    try {
      pendiente.current ??= {
        clave: crypto.randomUUID(),
        peticion: {
          terminalPos, turnoId, cupon,
          clienteId: cliente.tipoDocumento === 'SIN_DOCUMENTO' ? undefined : cliente.id,
          items: items.map(({ sku, cantidad }) => ({ sku, cantidad })),
          pago: {
            medioPago: medio,
            montoRecibidoEfectivo: medio === 'EFECTIVO' ? montoRecibido : undefined,
            montoTarjeta: medio === 'TARJETA_POS' ? total : undefined,
            referenciaOperacion: medio === 'TARJETA_POS' ? referencia.trim() : undefined,
          },
          comprobante: {
            tipo: tipoComprobante,
            numeroDocumento: cliente.numeroDocumento || undefined,
            razonSocial: cliente.nombre,
          },
          emitirTicketRegalo: regalo,
        },
      }
      const { clave, peticion } = pendiente.current
      const venta = await registrarVenta(peticion, clave)
      const comprobante = venta.comprobante
      const ventaCompleta: VentaFinalizada = {
        ...comprobante,
        pedidoId: venta.pedidoId,
        tipoComprobante: comprobante.tipo,
        medioPago: venta.pago.medioPago,
        montoRecibido: venta.pago.montoRecibido,
        vuelto: venta.pago.vuelto,
        referenciaOperacion: peticion.pago.referenciaOperacion,
        items: venta.items.map((linea) => {
          const prenda = items.find((item) => item.sku === linea.sku)
          return {
            sku: linea.sku, cantidad: linea.cantidad, precioUnitario: linea.precioFinal,
            nombre: prenda?.nombre ?? linea.sku, talla: prenda?.talla ?? '', color: prenda?.color ?? '',
          }
        }),
        cliente,
        vendedor,
        ticketRegalo: venta.ticketRegalo,
      }

      // Persistir en sessionStorage ANTES de navegar para que ReceiptPage pueda leerla
      sessionStorage.setItem('f5_ultima_venta', JSON.stringify(ventaCompleta))

      onVentaConfirmada(ventaCompleta)

      navigate('/pos/comprobante')
    } catch (causa) {
      const rechazo = causa instanceof ApiError && causa.status >= 400 && causa.status < 500
      if (rechazo) pendiente.current = null
      setReintento(!rechazo && pendiente.current !== null)
      setError(causa instanceof ApiError ? causa.message : 'No se pudo completar la venta. Intenta nuevamente.')
    } finally {
      enCurso.current = false
      setProcesando(false)
    }
  }

  return (
    /* overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-surface-ink)]/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Cobro de la venta"
    >
      {/* panel */}
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-[var(--color-border-default)] bg-white p-6 shadow-xl">
        {/* header */}
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl uppercase text-[var(--color-text-primary)]">
            Cobro de la venta
          </h2>
          {!procesando && !reintento && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-cloud-subtle)] transition-colors"
              aria-label="Cerrar"
            >
              <IconX size={20} />
            </button>
          )}
        </div>

        {/* total destacado */}
        <div className="flex items-baseline justify-between rounded-xl bg-[var(--color-surface-ink)] px-5 py-4 text-[var(--color-text-inverse)]">
          <span className="text-sm font-semibold uppercase tracking-wide">Total a pagar</span>
          <span className="font-heading text-4xl font-bold tabular-nums">
            {formatCurrency(total)}
          </span>
        </div>

        {/* error de API */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <fieldset disabled={procesando || reintento} className="flex flex-col gap-5 border-0 p-0">
          {/* comprobante */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Comprobante</p>
            <div className="flex gap-2">
              {(['BOLETA', 'FACTURA'] as TipoComprobante[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTipoComprobante(t)}
                  className={[
                    'flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
                    tipoComprobante === t
                      ? 'border-[var(--color-surface-ink)] bg-[var(--color-surface-ink)] text-[var(--color-text-inverse)]'
                      : 'border-[var(--color-border-default)] bg-white text-[var(--color-text-primary)] hover:bg-[var(--color-surface-cloud-subtle)]',
                  ].join(' ')}
                >
                  {t === 'BOLETA' ? 'Boleta de Venta' : 'Factura Electrónica'}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Cliente: {cliente.nombre} · {cliente.tipoDocumento} {cliente.numeroDocumento}
            </p>
            {errorComprobante && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {errorComprobante}
              </div>
            )}
            <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)] cursor-pointer">
              <input
                type="checkbox"
                checked={regalo}
                onChange={(e) => setRegalo(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              ¿Es para regalo? (Emitir Ticket de Cambio sin precios)
            </label>
          </div>

          {/* medio de pago */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Medio de pago</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setMedio('EFECTIVO'); setRecibido(''); setReferencia('') }}
                className={[
                  'flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors',
                  medio === 'EFECTIVO'
                    ? 'border-[var(--color-surface-ink)] bg-[var(--color-surface-ink)] text-[var(--color-text-inverse)]'
                    : 'border-[var(--color-border-default)] bg-white text-[var(--color-text-primary)] hover:bg-[var(--color-surface-cloud-subtle)]',
                ].join(' ')}
              >
                <IconCash size={18} aria-hidden /> Efectivo
              </button>
              <button
                onClick={() => { setMedio('TARJETA_POS'); setRecibido(''); setReferencia('') }}
                className={[
                  'flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors',
                  medio === 'TARJETA_POS'
                    ? 'border-[var(--color-surface-ink)] bg-[var(--color-surface-ink)] text-[var(--color-text-inverse)]'
                    : 'border-[var(--color-border-default)] bg-white text-[var(--color-text-primary)] hover:bg-[var(--color-surface-cloud-subtle)]',
                ].join(' ')}
              >
                <IconCreditCard size={18} aria-hidden /> Tarjeta / POS
              </button>
            </div>

            {medio === 'EFECTIVO' ? (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-[var(--color-text-primary)]">
                    Monto recibido (S/)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.10"
                    autoFocus
                    value={recibido}
                    onChange={(e) => setRecibido(e.target.value)}
                    className="rounded-lg border border-[var(--color-border-default)] px-3 py-2 text-sm focus:border-[var(--color-surface-ink)] focus:outline-none"
                    placeholder="0.00"
                  />
                  {recibido !== '' && vuelto < 0 && (
                    <p className="text-xs text-red-600">
                      Monto insuficiente (Faltan {formatCurrency(-vuelto)})
                    </p>
                  )}
                </div>

                {/* accesos rápidos de billetes */}
                <div className="flex flex-wrap gap-2">
                  {BILLETES.filter((b) => b >= total).map((b) => (
                    <button
                      key={b}
                      onClick={() => setRecibido(String(b))}
                      className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-cloud-subtle)] px-3 py-1.5 text-sm font-semibold hover:bg-[var(--color-border-default)] transition-colors"
                    >
                      {formatCurrency(b)}
                    </button>
                  ))}
                  <button
                    onClick={() => setRecibido(total.toFixed(2))}
                    className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-cloud-subtle)] px-3 py-1.5 text-sm font-semibold hover:bg-[var(--color-border-default)] transition-colors"
                  >
                    Exacto
                  </button>
                </div>

                {recibido !== '' && vuelto >= 0 && (
                  <p role="status" className="text-lg font-semibold text-green-600">
                    Vuelto a entregar: {formatCurrency(vuelto)}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="rounded-lg border border-[var(--color-accent-signal-soft)] bg-[var(--color-accent-signal-soft)] px-4 py-3 text-sm text-[var(--color-accent-signal)]">
                  Pase la tarjeta en el POS físico e ingrese los datos del voucher
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-[var(--color-text-primary)]">
                    N.° de Referencia / Operación
                  </label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="OP-983120"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value.toUpperCase())}
                    className="rounded-lg border border-[var(--color-border-default)] px-3 py-2 text-sm focus:border-[var(--color-surface-ink)] focus:outline-none"
                  />
                </div>
              </>
            )}
          </div>
        </fieldset>

        {/* footer */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} disabled={procesando || reintento} className="flex-1">
            Volver al carrito
          </Button>
          <button
            onClick={confirmar}
            disabled={procesando || (!reintento && (!pagoValido || !!errorComprobante))}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {procesando ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : null}
            Confirmar Pago y Finalizar
          </button>
        </div>
      </div>
    </div>
  )
}
