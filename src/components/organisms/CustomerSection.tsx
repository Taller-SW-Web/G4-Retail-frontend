import { useState, type FormEvent } from 'react'
import { IconBuilding, IconCircleCheck, IconId, IconSearch } from '@tabler/icons-react'
import { Button } from '../atoms/Button'
import { FormField } from '../molecules/FormField'
import { SegmentedControl } from '../molecules/SegmentedControl'
import { QuickCustomerModal } from './QuickCustomerModal'
import { ApiError } from '../../api/http'
import { buscarCliente } from '../../services'
import { useCartStore } from '../../store/cart'
import { toast } from '../../store/toast'
import { longitudDocumento, soloDigitos, validarDocumento } from '../../lib/validation'
import type { TipoDocumento } from '../../types'

/** RF-07 / RF-09: identificación del cliente por DNI (búsqueda) o RUC (captura directa). */
export function CustomerSection() {
  const cliente = useCartStore((s) => s.cliente)
  const asociarCliente = useCartStore((s) => s.asociarCliente)
  const [tipo, setTipo] = useState<TipoDocumento>('DNI')
  const [documento, setDocumento] = useState('')
  const [razonSocial, setRazonSocial] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [altaDni, setAltaDni] = useState<string | null>(null)

  const validacion = validarDocumento(tipo, documento)
  const listo = validacion.valido && (tipo === 'DNI' || razonSocial.trim().length > 2)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!listo || buscando) return
    if (tipo === 'RUC') {
      // El RUC no se consulta en Seguridad: viaja directo en la orden para la factura.
      return asociarCliente({ tipoDocumento: 'RUC', numeroDocumento: documento, nombre: razonSocial.trim() })
    }
    setBuscando(true)
    try {
      const encontrado = await buscarCliente(documento)
      asociarCliente({ id: encontrado.id, tipoDocumento: 'DNI', numeroDocumento: documento, nombre: encontrado.nombre })
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        toast.warning('El cliente no se encuentra registrado. Regístralo para continuar')
        setAltaDni(documento)
      } else if (err instanceof ApiError && err.status === 429) {
        toast.error('Alcanzaste el límite de consultas. Espera un momento e intenta de nuevo')
      } else if (!(err instanceof ApiError && err.status === 401)) {
        toast.error('No se pudo consultar al cliente. Intenta nuevamente')
      }
    } finally {
      setBuscando(false)
    }
  }

  return (
    <section aria-labelledby="titulo-cliente" className="flex flex-col gap-2">
      <h3 id="titulo-cliente" className="text-sm font-semibold">
        Identificación del Cliente
      </h3>

      {cliente ? (
        <div className="flex items-center gap-2 rounded-lg border border-success bg-success-bg p-4">
          <IconCircleCheck size={20} className="shrink-0 text-success" aria-hidden />
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-semibold">{cliente.nombre}</p>
            <p className="text-text-secondary">
              {cliente.tipoDocumento} {cliente.numeroDocumento}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              asociarCliente(null)
              setDocumento('')
              setRazonSocial('')
            }}
          >
            Cambiar Cliente
          </Button>
        </div>
      ) : (
        <form onSubmit={enviar} className="flex flex-col gap-2">
          <SegmentedControl
            label="Tipo de documento"
            value={tipo}
            onChange={(nuevo) => {
              setTipo(nuevo)
              setDocumento('')
            }}
            options={[
              { value: 'DNI', label: 'DNI', icon: <IconId size={20} aria-hidden /> },
              { value: 'RUC', label: 'RUC', icon: <IconBuilding size={20} aria-hidden /> },
            ]}
          />
          <FormField
            label={tipo === 'DNI' ? 'DNI del cliente' : 'RUC de la empresa'}
            inputMode="numeric"
            maxLength={longitudDocumento(tipo)}
            placeholder={tipo === 'DNI' ? '8 dígitos' : '11 dígitos'}
            value={documento}
            onChange={(e) => setDocumento(soloDigitos(e.target.value, longitudDocumento(tipo)))}
            estado={validacion.valido ? 'success' : 'default'}
            error={validacion.error}
            ayuda={documento ? validacion.ayuda : undefined}
          />
          {tipo === 'RUC' && (
            <FormField label="Razón social" value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} placeholder="Empresa S.A.C." />
          )}
          <Button type="submit" variant="secondary" disabled={!listo} loading={buscando} icon={<IconSearch size={20} aria-hidden />}>
            {tipo === 'DNI' ? 'Buscar' : 'Asociar a Venta'}
          </Button>
        </form>
      )}

      {altaDni && (
        <QuickCustomerModal
          numeroDocumento={altaDni}
          onClose={() => setAltaDni(null)}
          onAsociado={(nuevo) => {
            asociarCliente(nuevo)
            setAltaDni(null)
          }}
        />
      )}
    </section>
  )
}
