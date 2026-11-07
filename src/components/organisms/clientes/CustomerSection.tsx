import { useState, type FormEvent } from 'react'
import { IconCircleCheck, IconSearch } from '@tabler/icons-react'
import Button from '../../atoms/Button'
import Alert from '../../molecules/Alert'
import QuickCustomerModal from './QuickCustomerModal'
import { ApiError } from '../../../api/http'
import {
  REGLAS_DOCUMENTO,
  TIPOS_DOCUMENTO,
  enmascararDocumento,
  evaluarDocumento,
} from '../../../lib/documento'
import {
  aClienteVenta,
  buscarCliente,
  type ClienteVenta,
  type DocumentoPersona,
  type TipoDocumento,
} from './clientesApi'

const CLASE_CAMPO =
  'rounded-lg border bg-white px-4 py-2 font-normal focus:border-transparent focus:ring-2 focus:ring-accent-signal focus:outline-none'

interface CustomerSectionProps {
  /** Cliente identificado en la venta en curso, o `null` si todavía no se identifica a nadie. */
  cliente: ClienteVenta | null
  /** El dueño del carrito guarda el cliente; con `null` se suelta el que estaba asociado. */
  onAsociarCliente: (cliente: ClienteVenta | null) => void
}

/**
 * Identificación del cliente en mostrador (RF-07, RF-08 y RF-09).
 *
 * Es una sección **controlada**: no guarda el cliente en ningún store propio, solo avisa al carrito
 * quién quedó identificado. Así el mismo componente sirve tanto si el estado vive en la página como
 * si mañana se muda al store de la venta.
 *
 * Validación estricta (RF-09), con las mismas reglas que el backend (`lib/documento.ts`):
 * - DNI `^\d{8}$`, RUC `^(10|20)\d{9}$`, CE de 9 a 12 y pasaporte de 6 a 16 caracteres alfanuméricos.
 * - La máscara impide teclear lo que el tipo no admite y corta en la longitud máxima.
 * - Mientras se escribe se avisa cuántos caracteres faltan; el borde se pone verde al completar y
 *   rojo ante un error (por ejemplo, un RUC que no empieza con 10 o 20, que se marca de inmediato).
 * - El botón de búsqueda queda deshabilitado mientras el documento no sea válido.
 *
 * DNI, CE y pasaporte se buscan en el padrón; si responde `404` se abre el alta rápida sin perder el
 * carrito (RF-08). El RUC no se consulta: se captura con su razón social porque viaja tal cual en la
 * orden para la factura.
 */
export default function CustomerSection({ cliente, onAsociarCliente }: CustomerSectionProps) {
  const [tipo, setTipo] = useState<TipoDocumento>('DNI')
  const [documento, setDocumento] = useState('')
  const [razonSocial, setRazonSocial] = useState('')
  const [documentoTocado, setDocumentoTocado] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [aviso, setAviso] = useState<{ tono: 'warning' | 'error'; texto: string } | null>(null)
  const [alta, setAlta] = useState<{ tipo: DocumentoPersona; numero: string } | null>(null)

  const regla = REGLAS_DOCUMENTO[tipo]
  const estado = evaluarDocumento(tipo, documento)
  const documentoValido = estado.valido
  // El faltante de caracteres es un aviso neutro mientras se escribe; se vuelve error al salir del
  // campo. Un error de forma (prefijo de RUC) se marca en rojo de inmediato.
  const errorDocumento =
    documento !== '' && !estado.valido && (!estado.incompleto || documentoTocado)
  const listo = documentoValido && (tipo !== 'RUC' || razonSocial.trim().length > 2)

  function limpiar() {
    setDocumento('')
    setRazonSocial('')
    setDocumentoTocado(false)
    setAviso(null)
    setAlta(null)
  }

  function cambiarTipo(nuevo: TipoDocumento) {
    setTipo(nuevo)
    limpiar()
  }

  function cambiarCliente() {
    onAsociarCliente(null)
    limpiar()
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
      onAsociarCliente(aClienteVenta(await buscarCliente(tipo, documento)))
    } catch (fallo) {
      if (fallo instanceof ApiError && fallo.status === 404) {
        setAviso({
          tono: 'warning',
          texto: `El ${regla.etiqueta} ${documento} no figura en el padrón. Regístralo para continuar con la venta.`,
        })
        setAlta({ tipo, numero: documento })
      } else if (!(fallo instanceof ApiError && fallo.status === 401)) {
        // Un 401 lo resuelve el cliente HTTP: cierra la sesión y la app vuelve al login.
        setAviso({ tono: 'error', texto: mensajeDe(fallo) })
      }
    } finally {
      setBuscando(false)
    }
  }

  const textoBoton = tipo === 'RUC' ? 'Asociar' : buscando ? 'Buscando…' : 'Buscar'

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
              {REGLAS_DOCUMENTO[cliente.tipoDocumento]?.etiqueta ?? cliente.tipoDocumento} {cliente.numeroDocumento}
            </p>
          </div>
          <Button variant="outline" onClick={cambiarCliente}>
            Cambiar cliente
          </Button>
        </div>
      ) : (
        <form onSubmit={enviar} noValidate className="flex flex-col gap-2">
          <div
            role="group"
            aria-label="Tipo de documento"
            className="flex flex-wrap gap-1 self-start rounded-lg bg-surface-cloud-subtle p-1"
          >
            {TIPOS_DOCUMENTO.map((opcion) => (
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
                {REGLAS_DOCUMENTO[opcion].etiqueta}
              </button>
            ))}
          </div>

          <div className="flex items-start gap-2">
            <input
              aria-label={regla.nombreCampo}
              aria-describedby="ayuda-documento"
              aria-invalid={errorDocumento || undefined}
              inputMode={regla.soloDigitos ? 'numeric' : 'text'}
              autoCapitalize={regla.soloDigitos ? undefined : 'characters'}
              autoComplete="off"
              spellCheck={false}
              maxLength={regla.max}
              placeholder={regla.placeholder}
              value={documento}
              onChange={(evento) => setDocumento(enmascararDocumento(tipo, evento.target.value))}
              onBlur={() => setDocumentoTocado(true)}
              className={`${CLASE_CAMPO} min-w-0 flex-1 ${
                errorDocumento ? 'border-error' : documentoValido ? 'border-success' : 'border-border-default'
              }`}
            />

            <Button type="submit" variant="secondary" disabled={!listo || buscando} className="shrink-0 gap-2">
              <IconSearch size={20} aria-hidden />
              {textoBoton}
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
            aria-live={errorDocumento ? undefined : 'polite'}
            className={errorDocumento ? 'text-xs text-error' : 'text-xs text-text-secondary'}
          >
            {ayudaDe(tipo, documento, estado.mensaje, documentoValido)}
          </p>

          {aviso && <Alert tono={aviso.tono}>{aviso.texto}</Alert>}
        </form>
      )}

      {alta && (
        <QuickCustomerModal
          tipoDocumento={alta.tipo}
          numeroDocumento={alta.numero}
          onClose={() => setAlta(null)}
          onAsociado={(nuevo) => {
            onAsociarCliente(nuevo)
            setAlta(null)
            setAviso(null)
          }}
        />
      )}
    </section>
  )
}

function ayudaDe(tipo: TipoDocumento, documento: string, mensaje: string, valido: boolean): string {
  if (valido) return `${mensaje} Presiona ${tipo === 'RUC' ? 'Asociar' : 'Buscar'} para continuar.`
  if (documento !== '') return mensaje
  if (tipo === 'RUC') return 'RUC de 11 dígitos que empiece con 10 o 20, con la razón social (mínimo 3 caracteres) para la factura.'
  const regla = REGLAS_DOCUMENTO[tipo]
  return regla.soloDigitos
    ? `Escribe los ${regla.min} dígitos del ${regla.etiqueta} para buscarlo en el padrón.`
    : `Escribe el ${regla.etiqueta} (${regla.min} a ${regla.max} letras o números) para buscarlo en el padrón.`
}

function mensajeDe(fallo: unknown): string {
  if (fallo instanceof ApiError) {
    if (fallo.sinConexion) return 'No se pudo contactar al servidor. Revisa tu conexión.'
    if (fallo.status === 400 && fallo.codigo === 'DATO_INVALIDO') {
      return fallo.problema.errores?.[0]?.motivo ?? 'El documento no tiene un formato válido.'
    }
    if (fallo.status === 429) return 'Alcanzaste el límite de consultas al padrón. Espera un momento e intenta de nuevo.'
    if (fallo.status === 404) return 'El cliente no figura en el padrón.'
  }
  return 'No se pudo consultar al cliente. Intenta nuevamente.'
}
