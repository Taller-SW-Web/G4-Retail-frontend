import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCash, IconCreditCard, IconX } from '@tabler/icons-react'
import Button from '../../atoms/Button'
import { formatCurrency } from '../../../lib/format'
import { ContingenciaContext } from '../../../context/ContingenciaContext'
import { useEstadoConexion } from '../../../hooks/useEstadoConexion'
import { calcularHashContingencia } from '../../../lib/offlineHash'
import { guardarVentaOffline } from '../../../lib/offlineStorage'
import { useCajaStore } from '../../../store/caja'
import type { VentaOfflineRegistro } from '../../../types/contingencia'

// RF-13 / RF-14: tipos de pago y comprobante
export type MedioPago = 'EFECTIVO' | 'TARJETA_POS'
export type TipoComprobante = 'BOLETA' | 'FACTURA'

export interface ClienteResumen {
  id: string
  nombre: string
  tipoDocumento: 'DNI' | 'RUC' | 'CE' | 'PASAPORTE' | 'SIN_DOCUMENTO'
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
  tiendaId: string
  onClose: () => void
  /** Callback al confirmar venta exitosa — recibe los datos para el comprobante */
  onVentaConfirmada: (datos: {
    pedidoId: string
    tipoComprobante: TipoComprobante
    medioPago: MedioPago
    montoRecibido?: number
    vuelto?: number
    referenciaOperacion?: string
    subtotal: number
    igv: number
    total: number
    items: ItemVenta[]
    cliente: ClienteResumen
    vendedor: string
    serie: string
    correlativo: string
    fechaEmision: string
    esContingencia?: boolean
    correlativoContingencia?: string
    hashIntegridad?: string
    ventaLocalUuid?: string
  }) => void
}

const MONTO_BOLETA_REQUIERE_DNI = 700
const BILLETES = [50, 100, 200]

/** Genera un correlativo secuencial mock a partir del contador en sessionStorage. */
function generarCorrelativo(): string {
  const key = 'f5_correlativo_seq'
  const seq = Number(sessionStorage.getItem(key) || '0') + 1
  sessionStorage.setItem(key, String(seq))
  return String(seq).padStart(5, '0')
}

/** RF-13 / RF-14 / RF-15 / RF-26 / RF-27: cobro presencial y contingencia offline. */
export default function PaymentModal({
  total,
  cliente,
  items,
  vendedor,
  onClose,
  onVentaConfirmada,
}: PaymentModalProps) {
  const navigate = useNavigate()
  const ctx = useContext(ContingenciaContext)
  const enLineaDirecto = useEstadoConexion()
  const enLinea = ctx ? ctx.enLinea : enLineaDirecto

  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>('BOLETA')
  const [regalo, setRegalo] = useState(false)
  const [medio, setMedio] = useState<MedioPago>('EFECTIVO')
  const [recibido, setRecibido] = useState('')
  const [referencia, setReferencia] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // RF-26: en modo offline forzar siempre Efectivo
  useEffect(() => {
    if (!enLinea && medio === 'TARJETA_POS') {
      setMedio('EFECTIVO')
      setReferencia('')
    }
  }, [enLinea, medio])

  const montoRecibido = Number(recibido)
  const vuelto = montoRecibido - total

  const pagoValido =
    medio === 'EFECTIVO' ? recibido !== '' && vuelto >= 0 : referencia.trim() !== ''

  const errorComprobante =
    tipoComprobante === 'FACTURA' && cliente.tipoDocumento !== 'RUC'
      ? 'Para emitir Factura debe asociar un cliente con RUC corporativo'
      : tipoComprobante === 'BOLETA' &&
          total >= MONTO_BOLETA_REQUIERE_DNI &&
          cliente.tipoDocumento !== 'DNI'
        ? 'Por normativa SUNAT, ventas mayores o iguales a S/ 700.00 requieren identificar al cliente con su DNI'
        : null

  // IGV 18 %
  const igv = parseFloat((total * 0.18 / 1.18).toFixed(2))
  const subtotal = parseFloat((total - igv).toFixed(2))

  async function confirmar() {
    if (!pagoValido || errorComprobante || procesando) return
    setProcesando(true)
    setError(null)

    try {
      if (!enLinea) {
        // --- FLUJO CONTINGENCIA OFFLINE (RF-27 / CA-10-02) ---
        const ventaLocalUuid = crypto.randomUUID()
        const seq = Number(sessionStorage.getItem('f10_contingencia_seq') || '0') + 1
        sessionStorage.setItem('f10_contingencia_seq', String(seq))
        const correlativoContingencia = `CONT-${String(seq).padStart(5, '0')}`
        const fechaEmision = new Date().toISOString()

        const cajaActual = useCajaStore.getState().caja
        const terminalPos = cajaActual?.terminalPos || 'POS-01'
        const turnoId = cajaActual?.turnoId || '00000000-0000-0000-0000-000000000000'

        const hash = await calcularHashContingencia({
          terminalPos,
          turnoId,
          ventaLocalUuid,
          correlativoContingencia,
          fechaHoraOffline: fechaEmision,
          items: items.map((it) => ({
            sku: it.sku,
            cantidad: it.cantidad,
            precioUnitario: it.precioUnitario,
          })),
          totalNeto: total,
          efectivoRecibido: montoRecibido,
          vuelto: vuelto >= 0 ? vuelto : 0,
          clienteId: cliente.id || null,
        })

        const registroOffline: VentaOfflineRegistro = {
          ventaLocalUuid,
          terminalPos,
          turnoId,
          correlativoContingencia,
          fechaHoraOffline: fechaEmision,
          items: items.map((it) => ({
            sku: it.sku,
            cantidad: it.cantidad,
            precioUnitario: it.precioUnitario,
          })),
          totalNeto: total,
          efectivoRecibido: montoRecibido,
          vuelto: vuelto >= 0 ? vuelto : 0,
          clienteId: cliente.id || null,
          hashIntegridad: hash,
          estado: 'PENDIENTE',
          itemsDetalle: items,
          clienteDetalle: cliente,
          vendedor,
        }

        if (ctx?.registrarVentaOffline) {
          await ctx.registrarVentaOffline(registroOffline)
        } else {
          await guardarVentaOffline(registroOffline)
        }

        const ventaCompleta = {
          pedidoId: correlativoContingencia,
          tipoComprobante,
          medioPago: 'EFECTIVO' as MedioPago,
          montoRecibido,
          vuelto: vuelto >= 0 ? vuelto : 0,
          subtotal,
          igv,
          total,
          items,
          cliente,
          vendedor,
          serie: 'B010',
          correlativo: correlativoContingencia,
          fechaEmision,
          esContingencia: true,
          correlativoContingencia,
          hashIntegridad: hash,
          ventaLocalUuid,
        }

        sessionStorage.setItem('f5_ultima_venta', JSON.stringify(ventaCompleta))
        onVentaConfirmada(ventaCompleta)
        navigate('/pos/comprobante')
        return
      }

      // --- FLUJO ONLINE NORMAL (RF-15) ---
      await new Promise((r) => setTimeout(r, 600)) // simula latencia de red

      const pedidoId = `PED-${Date.now()}`
      const serie = tipoComprobante === 'FACTURA' ? 'F001' : 'B001'
      const correlativo = generarCorrelativo()
      const fechaEmision = new Date().toISOString()

      const ventaCompleta = {
        pedidoId,
        tipoComprobante,
        medioPago: medio,
        montoRecibido: medio === 'EFECTIVO' ? montoRecibido : undefined,
        vuelto: medio === 'EFECTIVO' ? vuelto : undefined,
        referenciaOperacion: medio === 'TARJETA_POS' ? referencia.trim() : undefined,
        subtotal,
        igv,
        total,
        items,
        cliente,
        vendedor,
        serie,
        correlativo,
        fechaEmision,
        esContingencia: false,
      }

      sessionStorage.setItem('f5_ultima_venta', JSON.stringify(ventaCompleta))
      onVentaConfirmada(ventaCompleta)
      navigate('/pos/comprobante')
    } catch {
      setProcesando(false)
      setError('No se pudo completar la venta. Intenta nuevamente.')
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
          {!procesando && (
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

        {/* aviso modo contingencia */}
        {!enLinea && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
            ⚠️ <strong>Modo Contingencia Activo:</strong> Sin conexión. Solo se admite cobro en efectivo. Se emitirá un ticket de contingencia y la venta se sincronizará automáticamente al volver la red.
          </div>
        )}

        {/* error de API */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <fieldset disabled={procesando} className="flex flex-col gap-5 border-0 p-0">
          {/* comprobante */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Comprobante</p>
            <div className="flex gap-2">
              {(['BOLETA', 'FACTURA'] as TipoComprobante[]).map((t) => (
                <button
                  key={t}
                  disabled={!enLinea && t === 'FACTURA'}
                  onClick={() => setTipoComprobante(t)}
                  className={[
                    'flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
                    !enLinea && t === 'FACTURA'
                      ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 opacity-60'
                      : tipoComprobante === t
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
                disabled={!enLinea}
                title={!enLinea ? 'Inhabilitado en contingencia offline' : undefined}
                onClick={() => {
                  if (!enLinea) return
                  setMedio('TARJETA_POS')
                  setRecibido('')
                  setReferencia('')
                }}
                className={[
                  'flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors',
                  !enLinea
                    ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 opacity-60'
                    : medio === 'TARJETA_POS'
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
          <Button variant="secondary" onClick={onClose} disabled={procesando} className="flex-1">
            Volver al carrito
          </Button>
          <button
            onClick={confirmar}
            disabled={!pagoValido || !!errorComprobante || procesando}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {procesando ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : null}
            {!enLinea ? 'Emitir Ticket Contingencia' : 'Confirmar Pago y Finalizar'}
          </button>
        </div>
      </div>
    </div>
  )
}






