import { useState } from 'react'
import { IconPrinter } from '@tabler/icons-react'
import { Button } from '../atoms/Button'
import { Checkbox } from '../atoms/Checkbox'
import { Logo } from '../atoms/Logo'
import { ProductImage } from '../atoms/ProductImage'
import { Alert } from '../molecules/Alert'
import { FormField } from '../molecules/FormField'
import { Modal } from '../molecules/Modal'
import { SegmentedControl } from '../molecules/SegmentedControl'
import { ApiError } from '../../api/http'
import { confirmarEntrega } from '../../services'
import { useAuthStore } from '../../store/auth'
import { toast } from '../../store/toast'
import { TIENDAS } from '../../lib/empresa'
import { formatFechaHora } from '../../lib/format'
import { esDniValido, soloDigitos, validarDocumento } from '../../lib/validation'
import type { PedidoPickup } from '../../types'

interface DeliveryModalProps {
  pedido: PedidoPickup
  /** La entrega quedó registrada: la bandeja debe retirar el pedido. */
  onEntregado: (pedidoId: string) => void
  onClose: () => void
}

type Receptor = 'TITULAR' | 'TERCERO'

interface Constancia {
  fechaHora: string
  dni: string
  nombre: string
  esTitular: boolean
}

/** RF-19: confirmación de entrega física al titular o a un tercero autorizado. */
export function DeliveryModal({ pedido, onEntregado, onClose }: DeliveryModalProps) {
  const usuario = useAuthStore((s) => s.usuario)!
  const [receptor, setReceptor] = useState<Receptor>('TITULAR')
  const [dni, setDni] = useState(pedido.clienteDni)
  const [nombre, setNombre] = useState(pedido.clienteNombre)
  const [verificado, setVerificado] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [constancia, setConstancia] = useState<Constancia | null>(null)

  const esTitular = receptor === 'TITULAR'
  const validacionDni = validarDocumento('DNI', dni)
  const valido = esDniValido(dni) && nombre.trim().length > 2 && verificado

  function cambiarReceptor(nuevo: Receptor) {
    setReceptor(nuevo)
    setDni(nuevo === 'TITULAR' ? pedido.clienteDni : '')
    setNombre(nuevo === 'TITULAR' ? pedido.clienteNombre : '')
  }

  async function confirmar() {
    if (!valido || procesando) return
    setProcesando(true)
    setError(null)
    try {
      const { fechaHora } = await confirmarEntrega({
        pedidoId: pedido.pedidoId,
        dniRecoge: dni,
        nombreRecoge: nombre.trim(),
        esTitular,
        encargadoEntregaId: usuario.id,
      })
      toast.success(`Entrega registrada con éxito. Pedido ${pedido.pedidoId} finalizado`)
      onEntregado(pedido.pedidoId)
      setConstancia({ fechaHora, dni, nombre: nombre.trim(), esTitular })
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) setError('El paquete no figura en estado listo para recojo')
      else setError('No se pudo registrar la entrega. Intenta nuevamente')
    } finally {
      setProcesando(false)
    }
  }

  if (constancia) {
    return (
      <Modal
        title="Entrega registrada"
        onClose={onClose}
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
            <Button icon={<IconPrinter size={20} aria-hidden />} onClick={() => window.print()}>
              Imprimir Constancia
            </Button>
          </>
        }
      >
        <article className="print-area flex flex-col gap-2 rounded-xl border border-border-default p-4 text-sm">
          <Logo compact />
          <p className="font-bold">CONSTANCIA DE ENTREGA EN TIENDA</p>
          <p>Pedido: {pedido.pedidoId}</p>
          <p>Tienda: {TIENDAS[usuario.tiendaId]?.nombre ?? usuario.tiendaId}</p>
          <p>Fecha y hora: {formatFechaHora(constancia.fechaHora)}</p>
          <p>Titular de la compra: {pedido.clienteNombre} (DNI {pedido.clienteDni})</p>
          <p>
            Recibido por: {constancia.nombre} (DNI {constancia.dni}) — {constancia.esTitular ? 'Titular' : 'Tercero autorizado'}
          </p>
          <p>
            Entregado por: {usuario.nombres} {usuario.apellidos} ({usuario.codigoVendedor})
          </p>
          <ul className="list-inside list-disc">
            {pedido.articulos.map((a) => (
              <li key={a.sku}>
                {a.cantidad} × {a.nombre} · Talla {a.talla} · {a.color}
              </li>
            ))}
          </ul>
        </article>
      </Modal>
    )
  }

  return (
    <Modal
      title="Confirmación de Entrega en Tienda"
      onClose={procesando ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={procesando}>
            Cancelar
          </Button>
          <Button variant="confirm" disabled={!valido} loading={procesando} onClick={confirmar}>
            Confirmar y Registrar Entrega
          </Button>
        </>
      }
    >
      <fieldset disabled={procesando} className="flex flex-col gap-6">
        {error && <Alert tono="error">{error}</Alert>}
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            <span className="font-semibold">{pedido.pedidoId}</span> · {pedido.clienteNombre} · {pedido.anaquelUbicacion}
          </p>
          <ul className="flex flex-col gap-2">
            {pedido.articulos.map((a) => (
              <li key={a.sku} className="flex items-center gap-2 rounded-lg border border-border-default p-2">
                <ProductImage categoria={a.categoria} size={24} className="size-12 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold">
                    {a.cantidad} × {a.nombre}
                  </p>
                  <p className="text-text-secondary">
                    Talla {a.talla} · {a.color}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold">¿Quién retira la mercadería?</p>
          <SegmentedControl
            label="¿Quién retira la mercadería?"
            value={receptor}
            onChange={cambiarReceptor}
            options={[
              { value: 'TITULAR', label: 'Titular de la compra' },
              { value: 'TERCERO', label: 'Tercero Autorizado' },
            ]}
          />
          <div className="grid grid-cols-1 gap-4 xs:grid-cols-2">
            <FormField
              label="DNI de quien recoge"
              inputMode="numeric"
              maxLength={8}
              readOnly={esTitular}
              value={dni}
              onChange={(e) => setDni(soloDigitos(e.target.value, 8))}
              estado={validacionDni.valido ? 'success' : 'default'}
              ayuda={dni ? validacionDni.ayuda : undefined}
            />
            <FormField label="Nombres completos" readOnly={esTitular} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
        </div>

        <Checkbox checked={verificado} onChange={(e) => setVerificado(e.target.checked)}>
          Confirmo que he verificado físicamente el contenido del paquete, el buen estado de las prendas deportivas y el documento de
          identidad de la persona receptora.
        </Checkbox>
      </fieldset>
    </Modal>
  )
}
