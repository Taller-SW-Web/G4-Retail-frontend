import { useState, type FormEvent } from 'react'
import Button from '../../atoms/Button'
import Alert from '../../molecules/Alert'
import Modal from '../../molecules/Modal'
import { ApiError } from '../../../api/http'
import { REGLAS_DOCUMENTO, esCorreoValido, esDocumentoValido } from '../../../lib/documento'
import {
  aClienteVenta,
  buscarCliente,
  registrarCliente,
  type ClienteVenta,
  type DocumentoPersona,
} from './clientesApi'

const FORM_ID = 'alta-rapida-cliente'

/**
 * Reglas de captura del alta rápida: documento con su formato oficial (RF-09, `lib/documento.ts`),
 * correo con forma válida y celular de 9.
 */
const CELULAR = /^9\d{8}$/

const CLASE_CAMPO =
  'rounded-lg border border-border-default bg-white px-4 py-2 font-normal focus:border-transparent focus:ring-2 focus:ring-accent-signal focus:outline-none'
const CLASE_CAMPO_FIJO =
  'rounded-lg border border-border-default bg-surface-cloud-subtle px-4 py-2 font-normal text-text-secondary'

interface QuickCustomerModalProps {
  /** Tipo del documento buscado: DNI, CE o pasaporte. El RUC no pasa por el alta rápida. */
  tipoDocumento: DocumentoPersona
  /** Documento que deja la búsqueda sin resultado (RF-07); se muestra de solo lectura. */
  numeroDocumento: string
  onClose: () => void
  onAsociado: (cliente: ClienteVenta) => void
}

/**
 * Alta rápida del cliente que no está en el padrón (RF-08).
 *
 * El objetivo es no perder el carrito armado: el documento ya viene tecleado y de solo lectura, y
 * solo se piden los datos mínimos para avisar del recojo y enviar la boleta digital. El botón de
 * guardar se habilita recién cuando el documento cumple su formato (RF-09) y los cuatro campos
 * restantes son válidos.
 *
 * Si el backend responde `409`, otro vendedor registró el mismo documento entre la búsqueda y el
 * guardado: en vez de mandar a repetir todo, se ofrece vincular al cliente que ya existe.
 */
export default function QuickCustomerModal({
  tipoDocumento,
  numeroDocumento,
  onClose,
  onAsociado,
}: QuickCustomerModalProps) {
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [emailTocado, setEmailTocado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [duplicado, setDuplicado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const regla = REGLAS_DOCUMENTO[tipoDocumento]
  const documentoValido = esDocumentoValido(tipoDocumento, numeroDocumento)
  const emailValido = esCorreoValido(email.trim())
  const telefonoValido = CELULAR.test(telefono)
  const completo =
    documentoValido && nombres.trim() !== '' && apellidos.trim() !== '' && emailValido && telefonoValido

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    if (!completo || guardando) return

    setGuardando(true)
    setError(null)
    try {
      const creado = await registrarCliente({
        canalOrigen: 'RETAIL',
        tipoDocumento,
        numeroDocumento,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        email: email.trim(),
        telefono,
      })
      onAsociado(aClienteVenta(creado))
    } catch (fallo) {
      if (fallo instanceof ApiError && fallo.status === 409) setDuplicado(true)
      else setError(mensajeDe(fallo))
      setGuardando(false)
    }
  }

  async function vincularExistente() {
    setGuardando(true)
    setError(null)
    try {
      onAsociado(aClienteVenta(await buscarCliente(tipoDocumento, numeroDocumento)))
    } catch (fallo) {
      setError(mensajeDe(fallo))
      setGuardando(false)
    }
  }

  return (
    <Modal
      title="Registrar nuevo cliente"
      onClose={guardando ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} disabled={!completo || guardando}>
            {guardando ? 'Registrando…' : 'Guardar y asociar a la venta'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={guardar} noValidate className="flex flex-col gap-6">
        {duplicado && (
          <Alert tono="warning" title="El documento ya está registrado">
            <p>
              Otro vendedor dio de alta este {regla.etiqueta} mientras buscabas. Puedes vincular al cliente que ya
              existe y continuar con la venta.
            </p>
            <div>
              <Button variant="outline" onClick={vincularExistente} disabled={guardando}>
                Vincular cliente existente
              </Button>
            </div>
          </Alert>
        )}
        {error && <Alert tono="error" title="No se pudo registrar al cliente">{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Tipo de documento
            <input value={regla.etiqueta} readOnly className={CLASE_CAMPO_FIJO} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Número de documento
            <input
              value={numeroDocumento}
              readOnly
              aria-invalid={!documentoValido || undefined}
              aria-describedby="ayuda-documento-alta"
              className={documentoValido ? CLASE_CAMPO_FIJO : `${CLASE_CAMPO_FIJO} border-error text-error`}
            />
            <span
              id="ayuda-documento-alta"
              role={documentoValido ? undefined : 'alert'}
              className={documentoValido ? 'text-xs font-normal text-text-secondary' : 'text-xs font-normal text-error'}
            >
              {documentoValido
                ? 'Documento verificado con el padrón.'
                : regla.soloDigitos
                  ? `El ${regla.etiqueta} debe tener exactamente ${regla.min} dígitos numéricos.`
                  : `El ${regla.etiqueta} debe tener de ${regla.min} a ${regla.max} caracteres alfanuméricos.`}
            </span>
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Nombres
            <input
              autoFocus
              autoComplete="off"
              maxLength={80}
              value={nombres}
              onChange={(evento) => setNombres(evento.target.value)}
              className={CLASE_CAMPO}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Apellidos
            <input
              autoComplete="off"
              maxLength={80}
              value={apellidos}
              onChange={(evento) => setApellidos(evento.target.value)}
              className={CLASE_CAMPO}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Correo electrónico
            <input
              type="email"
              autoComplete="off"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              onBlur={() => setEmailTocado(true)}
              aria-invalid={(emailTocado && !emailValido) || undefined}
              className={
                emailTocado && !emailValido ? `${CLASE_CAMPO} border-error` : CLASE_CAMPO
              }
            />
            {emailTocado && !emailValido ? (
              <span role="alert" className="text-xs font-normal text-error">
                Ingresa un correo electrónico válido (ej. cliente@correo.com).
              </span>
            ) : (
              <span className="text-xs font-normal text-text-secondary">
                Enviaremos la boleta digital a este correo.
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Teléfono celular
            <input
              inputMode="numeric"
              maxLength={9}
              autoComplete="off"
              value={telefono}
              onChange={(evento) => setTelefono(evento.target.value.replace(/\D/g, '').slice(0, 9))}
              aria-invalid={(telefono !== '' && !telefonoValido) || undefined}
              className={
                telefono !== '' && !telefonoValido ? `${CLASE_CAMPO} border-error` : CLASE_CAMPO
              }
            />
            {telefono !== '' && !telefonoValido ? (
              <span role="alert" className="text-xs font-normal text-error">
                El celular debe tener 9 dígitos y empezar con 9.
              </span>
            ) : (
              <span className="text-xs font-normal text-text-secondary">
                9 dígitos, empieza con 9. Para avisos de recojo o entrega.
              </span>
            )}
          </label>
        </div>
      </form>
    </Modal>
  )
}

function mensajeDe(fallo: unknown): string {
  if (fallo instanceof ApiError) {
    if (fallo.sinConexion) return 'No se pudo contactar al servidor. Revisa tu conexión.'
    if (fallo.status === 400 && fallo.codigo === 'DATO_INVALIDO') {
      return fallo.problema.errores?.[0]?.motivo ?? 'El documento no tiene un formato válido.'
    }
    if (fallo.status === 404) return 'El cliente ya no figura en el padrón. Vuelve a intentar la búsqueda.'
    if (fallo.status === 422) return 'Revisa los datos: el backend rechazó algún campo del cliente.'
  }
  return 'No se pudo registrar al cliente. Intenta nuevamente.'
}
