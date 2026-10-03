import { useState, type FormEvent } from 'react'
import { Button } from '../atoms/Button'
import { Alert } from '../molecules/Alert'
import { FormField } from '../molecules/FormField'
import { Modal } from '../molecules/Modal'
import { ApiError } from '../../api/http'
import { buscarCliente, registrarCliente } from '../../services'
import { toast } from '../../store/toast'
import { esEmailValido, soloDigitos } from '../../lib/validation'
import type { ClienteVenta } from '../../types'

interface QuickCustomerModalProps {
  /** DNI buscado en RF-07, precargado y de solo lectura. */
  numeroDocumento: string
  onClose: () => void
  onAsociado: (cliente: ClienteVenta) => void
}

const FORM_ID = 'alta-rapida-cliente'

/** RF-08: alta rápida de cliente sin perder el carrito en curso. */
export function QuickCustomerModal({ numeroDocumento, onClose, onAsociado }: QuickCustomerModalProps) {
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [emailTocado, setEmailTocado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [duplicado, setDuplicado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const emailValido = esEmailValido(email)
  const telefonoValido = /^9\d{8}$/.test(telefono)
  const completo = nombres.trim() && apellidos.trim() && emailValido && telefonoValido

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (!completo || guardando) return
    setGuardando(true)
    setError(null)
    try {
      const creado = await registrarCliente({
        canalOrigen: 'RETAIL',
        tipoDocumento: 'DNI',
        numeroDocumento,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        email: email.trim(),
        telefono,
      })
      toast.success('Cliente registrado y asociado exitosamente')
      onAsociado({ id: creado.id, tipoDocumento: 'DNI', numeroDocumento, nombre: `${creado.nombres} ${creado.apellidos}` })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setDuplicado(true)
      else setError('No se pudo registrar al cliente. Revisa los datos e intenta nuevamente')
      setGuardando(false)
    }
  }

  async function vincularExistente() {
    setGuardando(true)
    try {
      const existente = await buscarCliente(numeroDocumento)
      onAsociado({ id: existente.id, tipoDocumento: 'DNI', numeroDocumento, nombre: existente.nombre })
    } catch {
      setError('No se pudo vincular al cliente existente. Intenta nuevamente')
      setGuardando(false)
    }
  }

  return (
    <Modal
      title="Registrar Nuevo Cliente"
      onClose={guardando ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} disabled={!completo} loading={guardando}>
            Guardar y Asociar a Venta
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={guardar} noValidate className="flex flex-col gap-4">
        {duplicado && (
          <Alert tono="warning" title="El documento ya se encuentra registrado">
            <div>
              <Button variant="outline" onClick={vincularExistente} disabled={guardando}>
                Vincular cliente existente
              </Button>
            </div>
          </Alert>
        )}
        {error && <Alert tono="error">{error}</Alert>}
        <div className="grid grid-cols-1 gap-4 xs:grid-cols-2">
          <FormField label="Tipo de documento" value="DNI" readOnly disabled />
          <FormField label="Número de documento" value={numeroDocumento} readOnly disabled />
          <FormField label="Nombres" autoFocus autoComplete="off" value={nombres} onChange={(e) => setNombres(e.target.value)} />
          <FormField label="Apellidos" autoComplete="off" value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
          <FormField
            label="Correo electrónico"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTocado(true)}
            ayuda="Enviaremos la boleta digital a este correo."
            error={emailTocado && !emailValido ? 'Ingrese un correo electrónico válido (ej. cliente@correo.com)' : undefined}
          />
          <FormField
            label="Teléfono celular"
            inputMode="numeric"
            maxLength={9}
            autoComplete="off"
            value={telefono}
            onChange={(e) => setTelefono(soloDigitos(e.target.value, 9))}
            estado={telefonoValido ? 'success' : 'default'}
            ayuda="9 dígitos, empieza con 9. Para avisos de recojo o entrega."
          />
        </div>
      </form>
    </Modal>
  )
}
