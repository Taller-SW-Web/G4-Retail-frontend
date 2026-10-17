import { useState } from 'react'
import { IconPrinter } from '@tabler/icons-react'
import Button from '../../atoms/Button'
import Alert from '../../molecules/Alert'
import Modal from '../../molecules/Modal'
import { useAuthStore } from '../../../store/authStore'
import { ApiError } from '../../../api/http'
import { confirmarEntrega, type PedidoPickup } from '../../../api/pickupApi'
import { formatFechaHora } from '../../../lib/format'

interface DeliveryModalProps {
  pedido: PedidoPickup
  /** La entrega quedó registrada: la bandeja debe retirar el pedido. */
  onEntregado: (pedidoId: string) => void
  onClose: () => void
}

type Receptor = 'TITULAR' | 'TERCERO'

interface Constancia {
  constanciaId: string
  fechaHora: string
  dni: string
  nombre: string
  esTitular: boolean
}

const esDniValido = (dni: string) => /^\d{8}$/.test(dni)
const soloDigitos = (valor: string, max: number) => valor.replace(/\D/g, '').slice(0, max)

const claseInput =
  'w-full rounded-lg border border-[var(--color-border-default)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-accent-signal)] focus:ring-2 focus:ring-[var(--color-accent-signal-soft)] read-only:bg-[var(--color-surface-cloud-subtle)]'

/** RF-19: confirmación de entrega física al titular o a un tercero autorizado. */
export default function DeliveryModal({ pedido, onEntregado, onClose }: DeliveryModalProps) {
  const perfil = useAuthStore((s) => s.perfil)
  const nombreVendedor = useAuthStore((s) => s.nombre)
  const [receptor, setReceptor] = useState<Receptor>('TITULAR')
  const [dni, setDni] = useState(pedido.clienteDni)
  const [nombre, setNombre] = useState(pedido.clienteNombre)
  const [verificado, setVerificado] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [constancia, setConstancia] = useState<Constancia | null>(null)

  const esTitular = receptor === 'TITULAR'
  const faltanDigitos = 8 - dni.length
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
      const respuesta = await confirmarEntrega(pedido.pedidoId, {
        dniRecoge: dni,
        nombreRecoge: nombre.trim(),
        esTerceroAutorizado: !esTitular,
      })
      onEntregado(pedido.pedidoId)
      setConstancia({ constanciaId: respuesta.constanciaId, fechaHora: respuesta.fechaHoraEntrega, dni, nombre: nombre.trim(), esTitular })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar la entrega. Intenta nuevamente')
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
            <Button className="gap-2" onClick={() => window.print()}>
              <IconPrinter size={20} aria-hidden />
              Imprimir Constancia
            </Button>
          </>
        }
      >
        <Alert tono="success">Entrega registrada con éxito. Pedido {pedido.pedidoId} finalizado</Alert>
        <article className="flex flex-col gap-2 rounded-xl border border-[var(--color-border-default)] p-4 text-sm">
          <p className="font-bold">CONSTANCIA DE ENTREGA EN TIENDA</p>
          <p>N.° de constancia: {constancia.constanciaId}</p>
          <p>Pedido: {pedido.pedidoId}</p>
          {perfil && <p>Tienda: {perfil.tiendaId}</p>}
          <p>Fecha y hora: {formatFechaHora(constancia.fechaHora)}</p>
          <p>
            Titular de la compra: {pedido.clienteNombre} (DNI {pedido.clienteDni})
          </p>
          <p>
            Recibido por: {constancia.nombre} (DNI {constancia.dni}) — {constancia.esTitular ? 'Titular' : 'Tercero autorizado'}
          </p>
          {perfil && (
            <p>
              Entregado por: {nombreVendedor ?? 'Vendedor'} ({perfil.codigoVendedor})
            </p>
          )}
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
          <Button disabled={!valido || procesando} onClick={confirmar}>
            {procesando ? 'Registrando…' : 'Confirmar y Registrar Entrega'}
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
              <li key={a.sku} className="rounded-lg border border-[var(--color-border-default)] p-2 text-sm">
                <p className="font-semibold">
                  {a.cantidad} × {a.nombre}
                </p>
                <p className="text-[var(--color-text-secondary)]">
                  Talla {a.talla} · {a.color}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold">¿Quién retira la mercadería?</p>
          <div role="radiogroup" aria-label="¿Quién retira la mercadería?" className="grid grid-cols-2 gap-1 rounded-lg bg-[var(--color-surface-cloud-subtle)] p-1">
            {(
              [
                ['TITULAR', 'Titular de la compra'],
                ['TERCERO', 'Tercero Autorizado'],
              ] as const
            ).map(([valor, etiqueta]) => (
              <button
                key={valor}
                type="button"
                role="radio"
                aria-checked={receptor === valor}
                onClick={() => cambiarReceptor(valor)}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  receptor === valor ? 'bg-white shadow-sm' : 'text-[var(--color-text-secondary)]'
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold">DNI de quien recoge</span>
              <input
                className={claseInput}
                inputMode="numeric"
                maxLength={8}
                readOnly={esTitular}
                value={dni}
                onChange={(e) => setDni(soloDigitos(e.target.value, 8))}
              />
              {dni && faltanDigitos > 0 && (
                <span className="text-xs text-[var(--color-text-secondary)]">Ingrese 8 dígitos (faltan {faltanDigitos})</span>
              )}
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold">Nombres completos</span>
              <input className={claseInput} readOnly={esTitular} value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </label>
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 size-4" checked={verificado} onChange={(e) => setVerificado(e.target.checked)} />
          <span>
            Confirmo que he verificado físicamente el contenido del paquete, el buen estado de las prendas deportivas y el documento de
            identidad de la persona receptora.
          </span>
        </label>
      </fieldset>
    </Modal>
  )
}
