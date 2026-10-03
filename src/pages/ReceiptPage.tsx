import { useState } from 'react'
import { flushSync } from 'react-dom'
import { Navigate, useNavigate } from 'react-router-dom'
import { IconGift, IconPlus, IconPrinter } from '@tabler/icons-react'
import { Button } from '../components/atoms/Button'
import { Alert } from '../components/molecules/Alert'
import { SegmentedControl } from '../components/molecules/SegmentedControl'
import { Receipt } from '../components/organisms/Receipt'
import { useAuthStore } from '../store/auth'
import { useCartStore } from '../store/cart'

type Vista = 'venta' | 'cambio'

/** RF-15: pantalla de éxito con el comprobante emitido y sus acciones de impresión. */
export function ReceiptPage() {
  const navigate = useNavigate()
  const tiendaId = useAuthStore((s) => s.usuario!.tiendaId)
  const venta = useCartStore((s) => s.ultimaVenta)
  const nuevaVenta = useCartStore((s) => s.nuevaVenta)
  const [vista, setVista] = useState<Vista>('venta')

  if (!venta) return <Navigate to="/pos" replace />
  const conRegalo = !!venta.respuesta.ticketRegalo

  function imprimir(cual: Vista) {
    // El ticket visible es el que se imprime: se fuerza el render antes de abrir el diálogo.
    flushSync(() => setVista(cual))
    window.print()
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-2 print:hidden">
        <h1 className="font-heading text-[32px] leading-10 font-bold uppercase">Venta completada</h1>
        <Alert tono="success" title={`Pedido ${venta.respuesta.pedidoId} pagado`}>
          Todo listo. Entrega el comprobante a tu cliente.
        </Alert>
      </div>

      {conRegalo && (
        <div className="print:hidden">
          <SegmentedControl
            label="Vista del comprobante"
            value={vista}
            onChange={setVista}
            options={[
              { value: 'venta', label: 'Comprobante' },
              { value: 'cambio', label: 'Ticket de Cambio', icon: <IconGift size={20} aria-hidden /> },
            ]}
          />
        </div>
      )}

      <Receipt venta={venta} tiendaId={tiendaId} vista={vista} />

      <div className="flex flex-col gap-2 xs:flex-row xs:flex-wrap xs:justify-center print:hidden">
        <Button size="lg" icon={<IconPrinter size={20} aria-hidden />} onClick={() => imprimir('venta')}>
          Imprimir Ticket
        </Button>
        {conRegalo && (
          <Button variant="secondary" size="lg" icon={<IconGift size={20} aria-hidden />} onClick={() => imprimir('cambio')}>
            Imprimir Ticket de Cambio
          </Button>
        )}
        <Button
          variant="outline"
          size="lg"
          icon={<IconPlus size={20} aria-hidden />}
          onClick={() => {
            nuevaVenta()
            navigate('/pos')
          }}
        >
          Nueva Venta
        </Button>
      </div>
    </div>
  )
}
