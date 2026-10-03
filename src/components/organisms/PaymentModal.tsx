import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCash, IconCreditCard } from '@tabler/icons-react'
import { Button } from '../atoms/Button'
import { Checkbox } from '../atoms/Checkbox'
import { Alert } from '../molecules/Alert'
import { FormField } from '../molecules/FormField'
import { Modal } from '../molecules/Modal'
import { SegmentedControl } from '../molecules/SegmentedControl'
import { ApiError } from '../../api/http'
import { finalizarVenta } from '../../services'
import { useAuthStore } from '../../store/auth'
import { useCartStore } from '../../store/cart'
import { toast } from '../../store/toast'
import { formatSoles } from '../../lib/format'
import { MONTO_BOLETA_REQUIERE_DNI, calcularVuelto, type Totales } from '../../lib/totals'
import type { MedioPago, Pago, TipoComprobante } from '../../types'

interface PaymentModalProps {
  totales: Totales
  onClose: () => void
}

const BILLETES = [50, 100, 200]

/** RF-13 / RF-14 / RF-15: cobro presencial, tipo de comprobante y creación de la orden. */
export function PaymentModal({ totales, onClose }: PaymentModalProps) {
  const navigate = useNavigate()
  const usuario = useAuthStore((s) => s.usuario)!
  const { items, registrarVenta } = useCartStore()
  const cliente = useCartStore((s) => s.cliente)!
  const { total } = totales

  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>('BOLETA')
  const [regalo, setRegalo] = useState(false)
  const [medio, setMedio] = useState<MedioPago>('EFECTIVO')
  const [recibido, setRecibido] = useState('')
  const [referencia, setReferencia] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const montoRecibido = Number(recibido)
  const vuelto = calcularVuelto(total, montoRecibido)
  const pagoValido = medio === 'EFECTIVO' ? recibido !== '' && vuelto >= 0 : referencia.trim() !== ''

  const errorComprobante =
    tipoComprobante === 'FACTURA' && cliente.tipoDocumento !== 'RUC'
      ? 'Para emitir Factura debe asociar un cliente con RUC corporativo'
      : tipoComprobante === 'BOLETA' && total >= MONTO_BOLETA_REQUIERE_DNI && cliente.tipoDocumento !== 'DNI'
        ? 'Por normativa SUNAT, ventas mayores o iguales a S/ 700.00 requieren identificar al cliente con su DNI'
        : null

  async function confirmar() {
    if (!pagoValido || errorComprobante || procesando) return
    setProcesando(true)
    setError(null)
    const pago: Pago =
      medio === 'EFECTIVO'
        ? { medioPago: medio, monto: total, montoRecibido, vuelto }
        : { medioPago: medio, monto: total, referenciaOperacion: referencia.trim() }
    try {
      const respuesta = await finalizarVenta({
        canal: 'RETAIL',
        tiendaId: usuario.tiendaId,
        vendedorId: usuario.id,
        clienteId: cliente.id,
        emitirTicketRegalo: regalo,
        items: items.map((i) => ({ sku: i.sku, cantidad: i.cantidad, precioFinal: i.precioUnitario })),
        pago: { medioPago: pago.medioPago, monto: pago.monto, referenciaOperacion: pago.referenciaOperacion },
        comprobante: { tipo: tipoComprobante, numeroDocumento: cliente.numeroDocumento, razonSocial: cliente.nombre },
      })
      registrarVenta({ respuesta, items, cliente, pago, tipoComprobante, vendedor: `${usuario.nombres} ${usuario.apellidos}` })
      toast.success(`Venta ${respuesta.pedidoId} registrada con éxito`)
      navigate('/pos/comprobante')
    } catch (err) {
      setProcesando(false)
      if (!(err instanceof ApiError)) throw err
      if (err.status === 401) return
      const prenda = [err.problem.nombre, err.problem.sku].filter(Boolean).join(' / ')
      setError(
        err.status === 409
          ? `No se pudo completar la venta: La prenda ${prenda} se quedó sin existencias disponibles en tienda física`
          : err.status === 0
            ? 'No se pudo conectar con el servicio de ventas. No se realizó ningún cobro; intenta nuevamente'
            : `No se pudo completar la venta: ${err.message}`,
      )
    }
  }

  return (
    <Modal
      title="Cobro de la venta"
      onClose={procesando ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={procesando}>
            Volver al carrito
          </Button>
          <Button variant="confirm" size="lg" disabled={!pagoValido || !!errorComprobante} loading={procesando} onClick={confirmar}>
            Confirmar Pago y Finalizar
          </Button>
        </>
      }
    >
      <fieldset disabled={procesando} className="flex flex-col gap-6">
        <div className="flex items-baseline justify-between gap-4 rounded-lg bg-surface-ink p-4 text-text-inverse">
          <span className="text-sm font-semibold">TOTAL A PAGAR</span>
          <span className="font-heading text-[32px] leading-10 font-bold tabular-nums">{formatSoles(total)}</span>
        </div>

        {error && (
          <Alert tono="error" title="Venta no registrada">
            {error}
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Comprobante</p>
          <SegmentedControl
            label="Tipo de comprobante"
            value={tipoComprobante}
            onChange={setTipoComprobante}
            options={[
              { value: 'BOLETA', label: 'Boleta de Venta' },
              { value: 'FACTURA', label: 'Factura Electrónica' },
            ]}
          />
          <p className="text-xs text-text-secondary">
            Cliente: {cliente.nombre} · {cliente.tipoDocumento} {cliente.numeroDocumento}
          </p>
          {errorComprobante && <Alert tono="warning">{errorComprobante}</Alert>}
          <Checkbox checked={regalo} onChange={(e) => setRegalo(e.target.checked)}>
            ¿Es para regalo? (Emitir Ticket de Cambio sin precios)
          </Checkbox>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold">Medio de pago</p>
          <SegmentedControl
            label="Medio de pago"
            value={medio}
            onChange={(nuevo) => {
              setMedio(nuevo)
              setRecibido('')
              setReferencia('')
            }}
            options={[
              { value: 'EFECTIVO', label: 'Efectivo', icon: <IconCash size={20} aria-hidden /> },
              { value: 'TARJETA_POS', label: 'Tarjeta / POS Físico', icon: <IconCreditCard size={20} aria-hidden /> },
            ]}
          />

          {medio === 'EFECTIVO' ? (
            <>
              <FormField
                label="Monto recibido (S/)"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.10"
                autoFocus
                value={recibido}
                onChange={(e) => setRecibido(e.target.value)}
                error={recibido !== '' && vuelto < 0 ? `Monto insuficiente (Faltan ${formatSoles(-vuelto)})` : undefined}
              />
              <div className="flex flex-wrap gap-2">
                {BILLETES.filter((billete) => billete >= total).map((billete) => (
                  <Button key={billete} variant="secondary" onClick={() => setRecibido(String(billete))}>
                    {formatSoles(billete)}
                  </Button>
                ))}
                <Button variant="secondary" onClick={() => setRecibido(total.toFixed(2))}>
                  Exacto
                </Button>
              </div>
              {recibido !== '' && vuelto >= 0 && (
                <p role="status" className="text-lg leading-[26px] font-semibold text-success">
                  Vuelto a entregar: {formatSoles(vuelto)}
                </p>
              )}
            </>
          ) : (
            <>
              <Alert tono="info">Pase la tarjeta en el POS físico e ingrese los datos del voucher</Alert>
              <FormField
                label="N.° de Referencia / Operación"
                autoFocus
                placeholder="OP-983120"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value.toUpperCase())}
              />
            </>
          )}
        </div>
      </fieldset>
    </Modal>
  )
}
