import { useRef, useState, type FormEvent } from 'react'
import { IconBarcode, IconCheck, IconSearch } from '@tabler/icons-react'
import Button from '../../atoms/Button'
import Alert from '../../molecules/Alert'
import Modal from '../../molecules/Modal'
import { ApiError } from '../../../api/http'
import { esCodigoBarras, resolverCodigoBarras } from '../../../api/catalogoApi'
import {
  MIN_OBSERVACION,
  TIPOS_FALLA,
  reportarIncidencia,
  type IncidenciaRegistrada,
  type TipoFalla,
} from '../../../api/inventarioApi'
import { resolveScan } from '../../../lib/scanner'
import type { Product } from '../../../types'

type DiscrepancyModalProps = {
  /** Catálogo de la tienda: con él se identifica la prenda escaneada. */
  products: Product[]
  onClose: () => void
  /** Se llama al registrar la incidencia, para refrescar la cuarentena del POS. */
  onReportada?: (incidencia: IncidenciaRegistrada) => void
}

type Prenda = { sku: string; nombre: string; talla?: string; color?: string; codigoBarras?: string }

type Errores = Partial<Record<'codigo' | 'tipoFalla' | 'observacion' | 'envio', string>>

/** Mensajes para los rechazos que el vendedor puede resolver (contrato §5.12). */
const MENSAJES: Record<string, string> = {
  TURNO_NO_ABIERTO: 'Abre el turno de caja antes de reportar una incidencia.',
  IDEMPOTENCY_CONFLICT: 'Este reporte ya se envió con otros datos. Cierra el formulario y vuelve a intentarlo.',
  FORBIDDEN_USUARIO_SIN_TIENDA: 'Tu usuario no tiene un perfil activo en la tienda.',
}

/**
 * Reporte rápido de una prenda dañada o no ubicada (F12 · RF-32, tarea F1).
 *
 * El vendedor escanea la etiqueta o escribe el SKU, elige el motivo y describe el daño. Al confirmar,
 * la prenda queda en cuarentena y bloqueada para la venta en el POS (RF-33).
 */
export default function DiscrepancyModal({ products, onClose, onReportada }: DiscrepancyModalProps) {
  const [codigo, setCodigo] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [prenda, setPrenda] = useState<Prenda | null>(null)
  const [tipoFalla, setTipoFalla] = useState<TipoFalla | null>(null)
  const [observacion, setObservacion] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')
  const [errores, setErrores] = useState<Errores>({})
  const [enviando, setEnviando] = useState(false)
  const [registrada, setRegistrada] = useState<IncidenciaRegistrada | null>(null)
  // Misma clave en los reintentos del mismo reporte; cualquier cambio en el formulario genera otra.
  const clave = useRef<string | null>(null)

  const cambiar = <T,>(setter: (valor: T) => void) => (valor: T) => {
    clave.current = null
    setter(valor)
  }

  const buscar = async () => {
    const leido = codigo.trim()
    if (!leido) {
      setErrores((e) => ({ ...e, codigo: 'Escanea la etiqueta o escribe el SKU de la prenda' }))
      return
    }
    setBuscando(true)
    clave.current = null
    const match = resolveScan(products, leido) ?? (await resolverCodigoBarras(products, leido))
    setBuscando(false)

    if (!match) {
      setPrenda(null)
      setErrores((e) => ({ ...e, codigo: 'No encontramos esa etiqueta en el catálogo de la tienda' }))
      return
    }
    if (!match.variant && match.product.variants?.length) {
      setPrenda(null)
      setErrores((e) => ({ ...e, codigo: 'Escanea la etiqueta de la talla y color exactos de la prenda' }))
      return
    }
    const variante = match.variant
    setPrenda({
      sku: variante?.sku ?? match.product.id,
      nombre: match.product.name,
      talla: variante?.size,
      color: variante?.color,
      codigoBarras: esCodigoBarras(leido) ? leido : variante?.barcode || undefined,
    })
    setErrores((e) => ({ ...e, codigo: undefined }))
  }

  const validar = (): Errores => {
    const nuevos: Errores = {}
    if (!prenda) nuevos.codigo = 'Identifica la prenda antes de reportar'
    if (!tipoFalla) nuevos.tipoFalla = 'Selecciona el tipo de falla'
    if (observacion.trim().length < MIN_OBSERVACION) {
      nuevos.observacion = `Describe la falla con al menos ${MIN_OBSERVACION} caracteres`
    }
    return nuevos
  }

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault()
    const nuevos = validar()
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0 || !prenda || !tipoFalla) return

    clave.current ??= crypto.randomUUID()
    setEnviando(true)
    try {
      const resultado = await reportarIncidencia(
        {
          sku: prenda.sku,
          ...(prenda.codigoBarras ? { codigoBarras: prenda.codigoBarras } : {}),
          tipoFalla,
          detalleObservacion: observacion.trim(),
          ...(fotoUrl.trim() ? { evidenciaFotoUrl: fotoUrl.trim() } : {}),
        },
        clave.current,
      )
      setRegistrada(resultado)
      onReportada?.(resultado)
    } catch (err) {
      const mensaje =
        err instanceof ApiError
          ? (MENSAJES[err.codigo] ?? err.problema.errores?.[0]?.motivo ?? err.message)
          : 'No se pudo registrar la incidencia. Intenta nuevamente.'
      setErrores({ envio: mensaje })
    } finally {
      setEnviando(false)
    }
  }

  if (registrada) {
    return (
      <Modal
        title="Incidencia registrada"
        onClose={onClose}
        footer={
          <Button variant="primary" onClick={onClose}>
            Cerrar
          </Button>
        }
      >
        <Alert tono="success" title="La prenda quedó en cuarentena">
          <p>
            {prenda?.nombre} · SKU <span className="tabular-nums">{registrada.sku}</span> ya no se puede vender en el POS.
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Incidencia {registrada.incidenciaId.slice(0, 8)} ·{' '}
            {registrada.estado === 'PENDIENTE_REPORTE' ? 'Pendiente de confirmar por Inventario' : 'En cuarentena'}
          </p>
        </Alert>
      </Modal>
    )
  }

  return (
    <Modal title="Reportar incidencia" onClose={onClose}>
      <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="incidencia-codigo" className="text-sm font-semibold text-[var(--color-text-primary)]">
            Código de barras o SKU
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <IconBarcode
                size={18}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
              />
              <input
                id="incidencia-codigo"
                value={codigo}
                autoFocus
                aria-invalid={Boolean(errores.codigo)}
                aria-describedby={errores.codigo ? 'incidencia-codigo-error' : undefined}
                onChange={(e) => cambiar(setCodigo)(e.target.value)}
                onKeyDown={(e) => {
                  // El lector láser termina con Enter: busca sin enviar el formulario.
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void buscar()
                  }
                }}
                className="w-full rounded-lg border border-[var(--color-border-default)] py-2 pl-10 pr-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-signal)]"
              />
            </div>
            <Button type="button" variant="secondary" className="gap-2" onClick={() => void buscar()} disabled={buscando}>
              <IconSearch size={16} aria-hidden="true" />
              {buscando ? 'Buscando…' : 'Buscar'}
            </Button>
          </div>
          {errores.codigo && (
            <p id="incidencia-codigo-error" className="text-sm text-[var(--color-error)]">
              {errores.codigo}
            </p>
          )}
          {prenda && (
            <div
              aria-label="Prenda identificada"
              className="rounded-lg bg-[var(--color-surface-cloud-subtle)] p-3 text-sm text-[var(--color-text-primary)]"
            >
              <p className="font-semibold">{prenda.nombre}</p>
              <p className="text-[var(--color-text-secondary)]">
                SKU <span className="tabular-nums">{prenda.sku}</span>
                {prenda.talla ? ` · Talla ${prenda.talla}` : ''}
                {prenda.color ? ` · ${prenda.color}` : ''}
              </p>
            </div>
          )}
        </div>

        <fieldset aria-describedby={errores.tipoFalla ? 'incidencia-tipo-error' : undefined}>
          <legend className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">Tipo de falla</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {TIPOS_FALLA.map(({ valor, etiqueta }) => (
              <label
                key={valor}
                className={[
                  'flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-semibold text-[var(--color-text-primary)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--color-accent-signal)]',
                  // Seleccionado: borde y fondo de acento con texto primario (contraste AA), más el check.
                  tipoFalla === valor
                    ? 'border-[var(--color-accent-signal)] bg-[var(--color-accent-signal-soft)]'
                    : 'border-[var(--color-border-default)] bg-white hover:bg-[var(--color-surface-cloud-subtle)]',
                ].join(' ')}
              >
                {tipoFalla === valor && (
                  <IconCheck size={16} className="shrink-0 text-[var(--color-accent-signal)]" aria-hidden />
                )}
                <input
                  type="radio"
                  name="tipoFalla"
                  value={valor}
                  checked={tipoFalla === valor}
                  onChange={() => cambiar(setTipoFalla)(valor)}
                  className="sr-only"
                />
                {etiqueta}
              </label>
            ))}
          </div>
          {errores.tipoFalla && (
            <p id="incidencia-tipo-error" className="mt-2 text-sm text-[var(--color-error)]">
              {errores.tipoFalla}
            </p>
          )}
        </fieldset>

        <div className="flex flex-col gap-2">
          <label htmlFor="incidencia-observacion" className="text-sm font-semibold text-[var(--color-text-primary)]">
            Observaciones
          </label>
          <textarea
            id="incidencia-observacion"
            rows={3}
            value={observacion}
            aria-invalid={Boolean(errores.observacion)}
            aria-describedby={errores.observacion ? 'incidencia-observacion-error' : undefined}
            onChange={(e) => cambiar(setObservacion)(e.target.value)}
            placeholder="Ej.: mancha de maquillaje en el cuello"
            className="rounded-lg border border-[var(--color-border-default)] px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-signal)]"
          />
          {errores.observacion && (
            <p id="incidencia-observacion-error" className="text-sm text-[var(--color-error)]">
              {errores.observacion}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="incidencia-foto" className="text-sm font-semibold text-[var(--color-text-primary)]">
            URL de la foto de evidencia <span className="font-normal text-[var(--color-text-secondary)]">(opcional)</span>
          </label>
          <input
            id="incidencia-foto"
            type="url"
            value={fotoUrl}
            onChange={(e) => cambiar(setFotoUrl)(e.target.value)}
            className="rounded-lg border border-[var(--color-border-default)] px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-signal)]"
          />
        </div>

        {errores.envio && <Alert tono="error">{errores.envio}</Alert>}

        <Alert tono="warning">Al confirmar, la prenda se bloquea para la venta en todos los POS de la tienda.</Alert>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={enviando}>
            {enviando ? 'Registrando…' : 'Reportar y poner en cuarentena'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
