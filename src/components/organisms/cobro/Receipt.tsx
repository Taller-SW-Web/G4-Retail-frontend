import { QRCodeSVG } from 'qrcode.react'
import { formatCurrency } from '../../../lib/format'
import type { ClienteResumen, ItemVenta, MedioPago, TipoComprobante } from './PaymentModal'

// Datos de empresa (mock hasta integración con backend)
const EMPRESA = {
  razonSocial: 'INKA ATHLETICS S.A.C.',
  ruc: '20123456789',
}

const TIENDA_NOMBRE = 'Tienda Miraflores'
const TIENDA_DIRECCION = 'Av. Larco 1234, Miraflores, Lima'

export interface VentaFinalizada {
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
  fechaEmision: string
  /** Correlativo de la boleta: ej. B001-00001 */
  serie: string
  correlativo: string
  qr?: string
  ticketRegalo?: { codigoCanje: string; fechaLimiteCambio: string }
  /** F10: datos de emisión en contingencia offline (RF-27 / CA-10-04) */
  esContingencia?: boolean
  correlativoContingencia?: string
  hashIntegridad?: string
  ventaLocalUuid?: string
}

interface ReceiptProps {
  venta: VentaFinalizada
  /** 'venta': comprobante normal con precios. 'cambio': ticket de regalo sin precios. */
  vista: 'venta' | 'cambio'
}

const Separador = () => (
  <hr className="border-t border-dashed border-[var(--color-border-default)]" />
)

/** RF-15 / RF-27: ticket térmico de 80 mm (boleta/factura/contingencia) y ticket de cambio. */
export default function Receipt({ venta, vista }: ReceiptProps) {
  const {
    pedidoId,
    tipoComprobante,
    medioPago,
    montoRecibido,
    vuelto,
    referenciaOperacion,
    subtotal,
    igv,
    total,
    items,
    cliente,
    vendedor,
    fechaEmision,
    serie,
    correlativo,
    esContingencia,
    correlativoContingencia,
    hashIntegridad,
  } = venta

  const numero = esContingencia && correlativoContingencia ? correlativoContingencia : `${serie}-${correlativo}`
  const esCambio = vista === 'cambio'

  const qrValue = esCambio
    ? venta.ticketRegalo?.codigoCanje ?? `CAMBIO:${pedidoId}`
    : esContingencia
      ? `CONTINGENCIA:${correlativoContingencia || numero}|${hashIntegridad?.slice(0, 8)}|${total.toFixed(2)}`
      : venta.qr ?? [EMPRESA.ruc, serie, correlativo, igv.toFixed(2), total.toFixed(2), cliente.numeroDocumento].join('|')

  return (
    <article
      className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-xl border border-[var(--color-border-default)] bg-white p-6 text-xs shadow-md"
      aria-label="Comprobante de venta"
    >
      {/* cabecera empresa */}
      <header className="flex flex-col items-center gap-1 text-center">
        <p className="font-heading text-lg font-bold uppercase text-[var(--color-text-primary)]">
          {EMPRESA.razonSocial}
        </p>
        <p className="text-[var(--color-text-secondary)]">RUC {EMPRESA.ruc}</p>
        <p className="text-[var(--color-text-secondary)]">
          {TIENDA_NOMBRE} · {TIENDA_DIRECCION}
        </p>
      </header>

      <Separador />

      {/* tipo de documento */}
      <div className="text-center">
        <p className="text-sm font-bold uppercase text-[var(--color-text-primary)]">
          {esCambio
            ? 'TICKET DE CAMBIO'
            : esContingencia
              ? 'COMPROBANTE EMITIDO EN CONTINGENCIA OFFLINE'
              : tipoComprobante === 'FACTURA'
                ? 'FACTURA ELECTRÓNICA'
                : 'BOLETA DE VENTA ELECTRÓNICA'}
        </p>
        <p className="text-sm font-bold">{numero}</p>
        {esContingencia && hashIntegridad && (
          <p className="mt-1 font-mono text-[11px] font-semibold text-[var(--color-text-secondary)]">
            HASH SEGURIDAD: {hashIntegridad.slice(0, 8)}...
          </p>
        )}
        <p className="text-[var(--color-text-secondary)]">
          Emisión:{' '}
          {new Date(fechaEmision).toLocaleString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* datos del cliente (solo en comprobante normal) */}
      {!esCambio && (
        <>
          <Separador />
          <div className="flex flex-col gap-0.5">
            <p>
              <span className="font-semibold">{cliente.tipoDocumento}:</span>{' '}
              {cliente.numeroDocumento}
            </p>
            <p>
              <span className="font-semibold">
                {cliente.tipoDocumento === 'RUC' ? 'Razón social' : 'Cliente'}:
              </span>{' '}
              {cliente.nombre}
            </p>
            <p>
              <span className="font-semibold">Atendido por:</span> {vendedor}
            </p>
          </div>
        </>
      )}

      <Separador />

      {/* detalle de productos */}
      <table className="w-full">
        <thead>
          <tr className="text-left align-bottom">
            <th className="pr-2 font-semibold">Cant.</th>
            <th className="font-semibold">Prenda</th>
            {!esCambio && (
              <>
                <th className="pl-2 text-right font-semibold whitespace-nowrap">P. Unit.</th>
                <th className="pl-2 text-right font-semibold whitespace-nowrap">Importe</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.sku} className="align-top">
              <td className="pr-2 tabular-nums">{item.cantidad}</td>
              <td>
                <p className="font-semibold">{item.nombre}</p>
                <p className="text-[var(--color-text-secondary)]">
                  {item.color} · Talla {item.talla} · SKU {item.sku}
                </p>
              </td>
              {!esCambio && (
                <>
                  <td className="pl-2 text-right tabular-nums whitespace-nowrap">
                    {formatCurrency(item.precioUnitario)}
                  </td>
                  <td className="pl-2 text-right font-semibold tabular-nums whitespace-nowrap">
                    {formatCurrency(item.precioUnitario * item.cantidad)}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* totales (solo en comprobante normal) */}
      {!esCambio && (
        <>
          <Separador />
          <dl className="flex flex-col gap-1">
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-secondary)]">Op. Gravada</dt>
              <dd>{formatCurrency(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-secondary)]">IGV 18 %</dt>
              <dd>{formatCurrency(igv)}</dd>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <dt>Total Cancelado</dt>
              <dd>{formatCurrency(total)}</dd>
            </div>
          </dl>
          <Separador />
          {medioPago === 'EFECTIVO' ? (
            <p>
              Pago en efectivo: {formatCurrency(montoRecibido ?? total)} · Vuelto:{' '}
              {formatCurrency(vuelto ?? 0)}
            </p>
          ) : (
            <p>Pago con tarjeta (POS) · N.° operación: {referenciaOperacion}</p>
          )}
        </>
      )}

      {/* QR de verificación */}
      <div className="flex flex-col items-center gap-1">
        <QRCodeSVG size={96} value={qrValue} />
        <p className="text-[var(--color-text-secondary)]">
          {esCambio ? 'Código de cambio' : esContingencia ? 'Ticket de contingencia' : 'Verificación del comprobante'}
        </p>
        {esContingencia ? (
          <p className="text-center font-medium text-amber-800 text-[11px]">
            Comprobante emitido en contingencia offline. Pendiente de sincronización fiscal.
          </p>
        ) : (
          <p className="font-semibold">Pedido {pedidoId}</p>
        )}
      </div>
    </article>
  )
}
