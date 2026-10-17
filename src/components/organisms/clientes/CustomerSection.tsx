import { useState, type FormEvent } from 'react'
import { IconCircleCheck, IconSearch } from '@tabler/icons-react'
import Button from '../../atoms/Button'
import Alert from '../../molecules/Alert'
import QuickCustomerModal from './QuickCustomerModal'
import { ApiError } from '../../../api/http'
import { aClienteVenta, buscarCliente, type ClienteVenta, type TipoDocumento } from './clientesApi'

/** Longitud exacta de cada documento: el DNI tiene 8 dígitos y el RUC 11 (RF-07, RF-09). */
const LONGITUD: Record<TipoDocumento, number> = { DNI: 8, RUC: 11 }

const CLASE_CAMPO =
  'rounded-lg border bg-white px-4 py-2 font-normal focus:border-transparent focus:ring-2 focus:ring-accent-signal focus:outline-none'

interface CustomerSectionProps {
  /** Cliente identificado en la venta en curso, o `null` si todavía no se identifica a nadie. */
  cliente: ClienteVenta | null
  /** El dueño del carrito guarda el cliente; con `null` se suelta el que estaba asociado. */
  onAsociarCliente: (cliente: ClienteVenta | null) => void
}

/**
 * Identificación del cliente en mostrador (RF-07 y RF-09).
 *
 * Es una sección **controlada**: no guarda el cliente en ningún store propio, solo avisa al carrito
 * quién quedó identificado. Así el mismo componente sirve tanto si el estado vive en la página como
 * si mañana se muda al store de la venta.
 *
 * El DNI se busca en el padrón y el RUC no: el RUC se captura directo con su razón social porque
 * viaja tal cual en la orden para la factura. Si la consulta del DNI responde `404`, el cliente no
 * existe y se abre el alta rápida sin perder lo que ya está en el carrito (RF-08).
 */
export default function CustomerSection({ cliente, onAsociarCliente }: CustomerSectionProps) {
  const [tipo, setTipo] = useState<TipoDocumento>('DNI')
  const [documento, setDocumento] = useState('')
  const [razonSocial, setRazonSocial] = useState('')
  const [documentoTocado, setDocumentoTocado] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [aviso, setAviso] = useState<{ tono: 'warning' | 'error'; texto: string } | null>(null)
  const [altaDocumento, setAltaDocumento] = useState<string | null>(null)

  const longitud = LONGITUD[tipo]
  const documentoValido = documento.length === longitud
  const errorDocumento = documentoTocado && documento !== '' && !documentoValido
  const listo = documentoValido && (tipo === 'DNI' || razonSocial.trim().length > 2)

  function cambiarTipo(nuevo: TipoDocumento) {
    setTipo(nuevo)
    setDocumento('')
    setRazonSocial('')
    setDocumentoTocado(false)
    setAviso(null)
    setAltaDocumento(null)
  }

  function cambiarCliente() {
    onAsociarCliente(null)
    setDocumento('')
    setRazonSocial('')
    setDocumentoTocado(false)
    setAviso(null)
    setAltaDocumento(null)
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!listo || buscando) return

    if (tipo === 'RUC') {
      // El RUC no se consulta en el padrón: se captura para la factura y viaja en la orden.
      onAsociarCliente({ tipoDocumento: 'RUC', numeroDocumento: documento, nombre: razonSocial.trim() })
      return
    }

    setBuscando(true)
    setAviso(null)
    try {
      onAsociarCliente(aClienteVenta(await buscarCliente(documento)))
    } catch (fallo) {
      if (fallo instanceof ApiError && fallo.status === 404) {
        setAviso({
          tono: 'warning',
          texto: `El DNI ${documento} no figura en el padrón. Regístralo para continuar con la venta.`,
        })
        setAltaDocumento(documento)
      } else if (!(fallo instanceof ApiError && fallo.status === 401)) {
        // Un 401 lo resuelve el cliente HTTP: cierra la sesión y la app vuelve al login.
        setAviso({ tono: 'error', texto: mensajeDe(fallo) })
      }
    } finally {
      setBuscando(false)
    }
  }

  return (
    <section aria-labelledby="titulo-cliente" className="flex flex-col gap-2">
      <h3 id="titulo-cliente" className="font-heading text-2xl uppercase text-text-primary">
        Identificación del cliente
      </h3>

      {cliente ? (
        <div className="flex items-center gap-2 rounded-lg border border-success bg-success-bg px-4 py-2">
          <IconCircleCheck size={20} className="shrink-0 text-success" aria-hidden />
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-semibold">{cliente.nombre}</p>
            <p className="text-text-secondary">
              {cliente.tipoDocumento} {cliente.numeroDocumento}
            </p>
          </div>
          <Button variant="outline" onClick={cambiarCliente}>
            Cambiar cliente
          </Button>
        </div>
      ) : (
        <form onSubmit={enviar} noValidate className="flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <div
              role="group"
              aria-label="Tipo de documento"
              className="flex shrink-0 gap-1 rounded-lg bg-surface-cloud-subtle p-1"
            >
              {(['DNI', 'RUC'] as TipoDocumento[]).map((opcion) => (
                <button
                  key={opcion}
                  type="button"
                  aria-pressed={tipo === opcion}
                  onClick={() => cambiarTipo(opcion)}
                  className={[
                    'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
                    tipo === opcion
                      ? 'bg-white text-text-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary',
                  ].join(' ')}
                >
                  {opcion}
                </button>
              ))}
            </div>

            <input
              aria-label={tipo === 'DNI' ? 'DNI del cliente' : 'RUC de la empresa'}
              aria-describedby="ayuda-documento"
              aria-invalid={errorDocumento || undefined}
              inputMode="numeric"
              autoComplete="off"
              maxLength={longitud}
              placeholder={tipo === 'DNI' ? 'DNI: 8 dígitos' : 'RUC: 11 dígitos'}
              value={documento}
              onChange={(evento) => setDocumento(evento.target.value.replace(/\D/g, '').slice(0, longitud))}
              onBlur={() => setDocumentoTocado(true)}
              className={`${CLASE_CAMPO} min-w-0 flex-1 ${
                errorDocumento ? 'border-error' : documentoValido ? 'border-success' : 'border-border-default'
              }`}
            />

            <Button type="submit" variant="secondary" disabled={!listo || buscando} className="shrink-0 gap-2">
              <IconSearch size={20} aria-hidden />
              {tipo === 'DNI' ? (buscando ? 'Buscando…' : 'Buscar') : 'Asociar'}
            </Button>
          </div>

          {tipo === 'RUC' && (
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Razón social
              <input
                autoComplete="off"
                maxLength={120}
                placeholder="Inka Athletics S.A.C."
                value={razonSocial}
                onChange={(evento) => setRazonSocial(evento.target.value)}
                className={`${CLASE_CAMPO} border-border-default`}
              />
            </label>
          )}

          <p
            id="ayuda-documento"
            role={errorDocumento ? 'alert' : undefined}
            className={errorDocumento ? 'text-xs text-error' : 'text-xs text-text-secondary'}
          >
            {errorDocumento
              ? `El ${tipo} debe tener exactamente ${longitud} dígitos numéricos.`
              : ayudaDe(tipo, documentoValido)}
          </p>

          {aviso && <Alert tono={aviso.tono}>{aviso.texto}</Alert>}
        </form>
      )}

      {altaDocumento && (
        <QuickCustomerModal
          numeroDocumento={altaDocumento}
          onClose={() => setAltaDocumento(null)}
          onAsociado={(nuevo) => {
            onAsociarCliente(nuevo)
            setAltaDocumento(null)
            setAviso(null)
          }}
        />
      )}
    </section>
  )
}

function ayudaDe(tipo: TipoDocumento, documentoValido: boolean): string {
  if (documentoValido) return `${tipo} válido. Presiona ${tipo === 'DNI' ? 'Buscar' : 'Asociar'} para continuar.`
  if (tipo === 'RUC') return 'El RUC se captura con la razón social (mínimo 3 caracteres) para emitir la factura.'
  return 'Escribe los 8 dígitos del DNI para buscarlo en el padrón.'
}

function mensajeDe(fallo: unknown): string {
  if (fallo instanceof ApiError) {
    if (fallo.sinConexion) return 'No se pudo contactar al servidor. Revisa tu conexión.'
    if (fallo.status === 429) return 'Alcanzaste el límite de consultas al padrón. Espera un momento e intenta de nuevo.'
    if (fallo.status === 404) return 'El cliente no figura en el padrón.'
  }
  return 'No se pudo consultar al cliente. Intenta nuevamente.'
}
