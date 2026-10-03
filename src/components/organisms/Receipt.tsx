import { QRCodeSVG } from 'qrcode.react'
import { Logo } from '../atoms/Logo'
import { EMPRESA, TIENDAS } from '../../lib/empresa'
import { formatFecha, formatFechaHora, formatSoles } from '../../lib/format'
import type { VentaFinalizada } from '../../types'

interface ReceiptProps {
  venta: VentaFinalizada
  tiendaId: string
  /** `cambio`: ticket de regalo, sin precios ni desglose de IGV. */
  vista: 'venta' | 'cambio'
}

const Separador = () => <hr className="border-t border-dashed border-text-secondary" />

/** RF-15: ticket térmico de 80 mm (boleta/factura) y ticket de cambio para regalos. */
export function Receipt({ venta, tiendaId, vista }: ReceiptProps) {
  const { respuesta, items, cliente, pago, tipoComprobante } = venta
  const { comprobante, ticketRegalo } = respuesta
  const tienda = TIENDAS[tiendaId]
  const numero = `${comprobante.serie}-${comprobante.correlativo}`
  const esCambio = vista === 'cambio' && !!ticketRegalo

  return (
    <article className="print-area mx-auto flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border-default bg-white p-6 text-xs shadow-md">
      <header className="flex flex-col items-center gap-1 text-center">
        <Logo />
        <p className="font-semibold">{EMPRESA.razonSocial}</p>
        <p>RUC {EMPRESA.ruc}</p>
        <p>
          {tienda?.nombre} · {tienda?.direccion}
        </p>
      </header>
      <Separador />
      <div className="text-center">
        <p className="text-sm font-bold">
          {esCambio ? 'TICKET DE CAMBIO' : tipoComprobante === 'FACTURA' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA'}
        </p>
        <p className="text-sm font-bold">{esCambio ? ticketRegalo.codigoCanje : numero}</p>
        <p>Emisión: {formatFechaHora(comprobante.fechaEmision)}</p>
        {esCambio && <p>Comprobante de referencia: {numero}</p>}
      </div>
      {!esCambio && (
        <>
          <Separador />
          <div>
            <p>
              {cliente.tipoDocumento}: {cliente.numeroDocumento}
            </p>
            <p>
              {cliente.tipoDocumento === 'RUC' ? 'Razón social' : 'Cliente'}: {cliente.nombre}
            </p>
            <p>Atendido por: {venta.vendedor}</p>
          </div>
        </>
      )}
      <Separador />
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
                {item.nombre}
                <br />
                Talla {item.talla} · {item.color}
                {esCambio && (
                  <>
                    <br />
                    {item.sku}
                  </>
                )}
              </td>
              {!esCambio && (
                <>
                  <td className="pl-2 text-right whitespace-nowrap tabular-nums">{formatSoles(item.precioUnitario)}</td>
                  <td className="pl-2 text-right whitespace-nowrap tabular-nums">{formatSoles(item.precioUnitario * item.cantidad)}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <Separador />
      {esCambio ? (
        <p className="text-center font-semibold">
          Válido para cambio en cualquier tienda física hasta {formatFecha(ticketRegalo.fechaLimiteCambio)}
        </p>
      ) : (
        <>
          <dl className="flex flex-col gap-1 tabular-nums">
            <div className="flex justify-between">
              <dt>Op. Gravada</dt>
              <dd>{formatSoles(comprobante.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>IGV 18 %</dt>
              <dd>{formatSoles(comprobante.igv)}</dd>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <dt>Total Cancelado</dt>
              <dd>{formatSoles(comprobante.total)}</dd>
            </div>
          </dl>
          <Separador />
          {pago.medioPago === 'EFECTIVO' ? (
            <p>
              Pago en efectivo: {formatSoles(pago.montoRecibido ?? pago.monto)} · Vuelto: {formatSoles(pago.vuelto ?? 0)}
            </p>
          ) : (
            <p>Pago con tarjeta (POS) · N.° operación: {pago.referenciaOperacion}</p>
          )}
        </>
      )}
      <div className="flex flex-col items-center gap-1">
        <QRCodeSVG
          size={96}
          value={
            esCambio
              ? ticketRegalo.codigoCanje
              : [EMPRESA.ruc, comprobante.serie, comprobante.correlativo, comprobante.igv.toFixed(2), comprobante.total.toFixed(2), cliente.numeroDocumento].join('|')
          }
        />
        <p>{esCambio ? 'Código de cambio' : 'Verificación del comprobante'}</p>
        <p className="font-semibold">Pedido {respuesta.pedidoId}</p>
      </div>
    </article>
  )
}
