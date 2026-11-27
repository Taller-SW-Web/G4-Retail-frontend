import { useMemo, useState, type FormEvent } from 'react'
import { IconPrinter, IconScan, IconTrash } from '@tabler/icons-react'
import Badge from '../../atoms/Badge'
import Button from '../../atoms/Button'
import Alert from '../../molecules/Alert'
import Modal from '../../molecules/Modal'
import ConstanciaCambioTicket from './ConstanciaCambioTicket'
import { ApiError } from '../../../api/http'
import {
  registrarCambio,
  type CambioRegistrado,
  type InspeccionPrenda,
  type ItemCambiable,
  type MedioPagoDiferencia,
  type MotivoCambio,
} from '../../../api/cambiosApi'
import { evaluarInspeccion, MOTIVOS } from '../../../lib/inspeccion'
import { pagoDiferenciaValido, resumirCambio, type PrendaElegida } from '../../../lib/cambioDirecto'
import { resolveScan } from '../../../lib/scanner'
import { formatCurrency } from '../../../lib/format'
import type { Product } from '../../../types'

interface ExchangeModalProps {
  boletaNumero: string
  item: ItemCambiable
  /** Catálogo de la tienda, para elegir las prendas nuevas por escáner o SKU. */
  catalogo: Product[]
  turno: { turnoId: string; terminalPos: string }
  /** El cambio quedó registrado: la pantalla debe actualizar las unidades disponibles. */
  onCambioRegistrado: (cambio: CambioRegistrado, cantidad: number) => void
  onClose: () => void
}

const CHECKLIST: { campo: keyof InspeccionPrenda; etiqueta: string }[] = [
  { campo: 'etiquetasIntactas', etiqueta: 'Etiquetas colgantes originales intactas' },
  { campo: 'sinSignosUso', etiqueta: 'Prenda limpia y sin signos de uso' },
  { campo: 'empaqueOriginal', etiqueta: 'Empaque o caja original apta' },
]

const ETIQUETA_TIPO = {
  MISMO_VALOR: 'Mismo valor · sin cobro',
  MAYOR_VALOR: 'Mayor valor · se cobra la diferencia',
  MENOR_VALOR: 'Menor valor · no permitido',
} as const

/**
 * Cambio directo de prenda (F9 · RF-24 y RF-25, contrato §5.9).
 *
 * Tras la inspección, el vendedor elige las prendas nuevas con el escáner o el SKU y la pantalla
 * muestra el crédito, el total y la diferencia. El menor valor se bloquea; en mayor valor se cobra
 * solo la diferencia, con las reglas de cobro de F5. Al confirmar, imprime la constancia.
 */
export default function ExchangeModal({
  boletaNumero,
  item,
  catalogo,
  turno,
  onCambioRegistrado,
  onClose,
}: ExchangeModalProps) {
  const [motivo, setMotivo] = useState<MotivoCambio>('CAMBIO_TALLA')
  const [cantidad, setCantidad] = useState(1)
  const [inspeccion, setInspeccion] = useState<InspeccionPrenda>({
    etiquetasIntactas: false,
    sinSignosUso: false,
    empaqueOriginal: false,
  })
  const [nuevas, setNuevas] = useState<PrendaElegida[]>([])
  const [lectura, setLectura] = useState('')
  const [avisoLectura, setAvisoLectura] = useState<string | null>(null)
  const [medio, setMedio] = useState<MedioPagoDiferencia>('EFECTIVO')
  const [recibido, setRecibido] = useState('')
  const [referencia, setReferencia] = useState('')
  // Una clave por intento de cambio: si la red se corta y se reintenta, no se cobra dos veces.
  const [claveIdempotencia] = useState(() => crypto.randomUUID())
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registrado, setRegistrado] = useState<CambioRegistrado | null>(null)

  const evaluacion = evaluarInspeccion(motivo, inspeccion)
  const productoDevuelto = useMemo(
    () => catalogo.find((p) => p.variants?.some((v) => v.sku === item.sku))?.id ?? null,
    [catalogo, item.sku],
  )
  const resumen = resumirCambio({ productoId: productoDevuelto, cantidad, precioPagado: item.precioPagado }, nuevas)
  const pagoValido = pagoDiferenciaValido(medio, resumen.diferencia, recibido, referencia)
  const puedeConfirmar =
    evaluacion.puedeAprobar &&
    nuevas.length > 0 &&
    resumen.tipo !== 'MENOR_VALOR' &&
    (resumen.tipo !== 'MAYOR_VALOR' || pagoValido) &&
    !procesando

  const agregar = (evento: FormEvent) => {
    evento.preventDefault()
    const encontrado = resolveScan(catalogo, lectura)
    if (!encontrado?.variant) {
      setAvisoLectura(`No hay una prenda con el código ${lectura.trim()}.`)
      return
    }
    const { product, variant } = encontrado
    setAvisoLectura(null)
    setLectura('')
    setNuevas((actual) =>
      actual.some((p) => p.sku === variant.sku)
        ? actual.map((p) => (p.sku === variant.sku ? { ...p, cantidad: p.cantidad + 1 } : p))
        : [
            ...actual,
            {
              sku: variant.sku,
              productoId: product.id,
              nombre: `${product.name} · ${variant.size} · ${variant.color}`,
              cantidad: 1,
              precioUnitario: variant.price ?? product.price,
            },
          ],
    )
  }

  const confirmar = async () => {
    setProcesando(true)
    setError(null)
    try {
      const mayor = resumen.tipo === 'MAYOR_VALOR'
      const cambio = await registrarCambio(
        {
          boletaNumero,
          terminalPos: turno.terminalPos,
          turnoId: turno.turnoId,
          motivo,
          devuelto: { sku: item.sku, cantidad, inspeccion },
          nuevos: nuevas.map(({ sku, cantidad: unidades }) => ({ sku, cantidad: unidades })),
          pagoDiferencia: mayor
            ? medio === 'EFECTIVO'
              ? { medioPago: 'EFECTIVO', montoRecibidoEfectivo: Number(recibido) }
              : { medioPago: 'TARJETA_POS', montoTarjeta: resumen.diferencia, referenciaOperacion: referencia.trim() }
            : null,
          comprobante: mayor ? { tipo: 'BOLETA' } : null,
          clienteId: null,
        },
        claveIdempotencia,
      )
      setRegistrado(cambio)
      onCambioRegistrado(cambio, cantidad)
    } catch (causa) {
      setError(causa instanceof ApiError ? causa.message : 'No se pudo registrar el cambio. Intenta de nuevo.')
    } finally {
      setProcesando(false)
    }
  }

  if (registrado) {
    return (
      <Modal
        title="Cambio registrado"
        onClose={onClose}
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
            <Button className="gap-2" onClick={() => window.print()}>
              <IconPrinter size={18} /> Imprimir constancia
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {registrado.estadoInventario === 'PENDIENTE' && (
            <Alert tono="info">
              Ventas aún no confirma el pedido del cambio. Retail lo reintenta solo; entrega la prenda normalmente.
            </Alert>
          )}
          <ConstanciaCambioTicket cambio={registrado} />
        </div>
      </Modal>
    )
  }

  const textoBoton =
    resumen.tipo === 'MAYOR_VALOR'
      ? `Cobrar ${formatCurrency(resumen.diferencia)} y confirmar cambio`
      : 'Confirmar cambio'

  return (
    <Modal
      title="Cambio de prenda"
      size="lg"
      onClose={procesando ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={procesando}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={!puedeConfirmar}>
            {procesando ? 'Registrando…' : textoBoton}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div>
          <p className="font-semibold text-[var(--color-text-primary)]">{item.descripcion}</p>
          <p className="font-mono text-xs text-[var(--color-text-secondary)]">
            {item.sku} · {formatCurrency(item.precioPagado)} c/u · boleta {boletaNumero}
          </p>
        </div>

        <fieldset>
          <legend className="mb-2 font-semibold">Motivo del cambio</legend>
          <div className="flex flex-wrap gap-2">
            {MOTIVOS.map((opcion) => (
              <label
                key={opcion.valor}
                className={`cursor-pointer rounded-lg border px-3 py-2 ${
                  motivo === opcion.valor
                    ? 'border-[var(--color-accent-signal)] bg-[var(--color-accent-signal-soft)] font-semibold'
                    : 'border-[var(--color-border-default)]'
                }`}
              >
                <input
                  type="radio"
                  name="motivo"
                  value={opcion.valor}
                  checked={motivo === opcion.valor}
                  onChange={() => setMotivo(opcion.valor)}
                  className="sr-only"
                />
                {opcion.etiqueta}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex items-center gap-3">
          <span className="font-semibold">Unidades que devuelve</span>
          <input
            type="number"
            min={1}
            max={item.cantidadDisponibleCambio}
            value={cantidad}
            onChange={(evento) =>
              setCantidad(Math.min(item.cantidadDisponibleCambio, Math.max(1, Number(evento.target.value) || 1)))
            }
            className="w-20 rounded-lg border border-[var(--color-border-default)] px-3 py-1.5"
          />
          <span className="text-xs text-[var(--color-text-secondary)]">
            de {item.cantidadDisponibleCambio} disponibles
          </span>
        </label>

        <fieldset>
          <legend className="mb-2 font-semibold">Estado físico de la prenda</legend>
          <div className="space-y-2">
            {CHECKLIST.map(({ campo, etiqueta }) => (
              <label key={campo} className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={inspeccion[campo]}
                  onChange={(evento) => setInspeccion((actual) => ({ ...actual, [campo]: evento.target.checked }))}
                  className="h-4 w-4"
                />
                {etiqueta}
              </label>
            ))}
          </div>
        </fieldset>

        {evaluacion.porGarantia && (
          <Alert tono="info" title="Caso de garantía">
            Deriva la prenda a Postventa para revisión de garantía. En mostrador no se hace el cambio.
          </Alert>
        )}
        {!evaluacion.puedeAprobar && !evaluacion.porGarantia && (
          <Alert tono="warning" title="No se puede aprobar el cambio">
            Falta: {evaluacion.faltantes.join(' · ')}
          </Alert>
        )}

        {evaluacion.puedeAprobar && (
          <section aria-label="Prendas nuevas" className="space-y-3 border-t border-[var(--color-border-default)] pt-4">
            <form onSubmit={agregar} className="flex gap-2">
              <input
                value={lectura}
                onChange={(evento) => setLectura(evento.target.value)}
                placeholder="Escanea la etiqueta o escribe el SKU"
                aria-label="Prenda nueva"
                className="flex-1 rounded-lg border border-[var(--color-border-default)] px-3 py-2 font-mono"
              />
              <Button type="submit" variant="outline" className="gap-2">
                <IconScan size={18} /> Agregar
              </Button>
            </form>
            {avisoLectura && <Alert tono="warning">{avisoLectura}</Alert>}

            {nuevas.length > 0 && (
              <ul className="divide-y divide-[var(--color-border-default)] rounded-lg border border-[var(--color-border-default)]">
                {nuevas.map((prenda) => (
                  <li key={prenda.sku} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div>
                      <p className="font-semibold">{prenda.nombre}</p>
                      <p className="font-mono text-xs text-[var(--color-text-secondary)]">
                        {prenda.sku} · {prenda.cantidad} × {formatCurrency(prenda.precioUnitario)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      aria-label={`Quitar ${prenda.sku}`}
                      onClick={() => setNuevas((actual) => actual.filter((p) => p.sku !== prenda.sku))}
                    >
                      <IconTrash size={16} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {nuevas.length > 0 && (
              <dl aria-label="Resumen del cambio" className="space-y-1 rounded-lg bg-[var(--color-surface-cloud)] p-3">
                <div className="flex justify-between">
                  <dt>Crédito de la prenda devuelta</dt>
                  <dd>{formatCurrency(resumen.credito)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Total de las prendas nuevas</dt>
                  <dd>{formatCurrency(resumen.totalNuevo)}</dd>
                </div>
                <div className="flex justify-between font-semibold">
                  <dt>Diferencia a cobrar</dt>
                  <dd>{formatCurrency(resumen.diferencia)}</dd>
                </div>
                <div className="pt-1">
                  <Badge tone={resumen.tipo === 'MENOR_VALOR' ? 'warning' : 'success'}>{ETIQUETA_TIPO[resumen.tipo]}</Badge>
                </div>
              </dl>
            )}

            {resumen.tipo === 'MENOR_VALOR' && nuevas.length > 0 && (
              <Alert tono="warning" title="Cambio de menor valor">
                Las prendas nuevas cuestan menos que el crédito. No se emiten vales ni se devuelve dinero: elige
                prendas de igual o mayor valor.
              </Alert>
            )}

            {resumen.tipo === 'MAYOR_VALOR' && (
              <fieldset className="space-y-2">
                <legend className="mb-1 font-semibold">Cobro de la diferencia</legend>
                <div className="flex gap-2">
                  {(['EFECTIVO', 'TARJETA_POS'] as const).map((opcion) => (
                    <label key={opcion} className="flex cursor-pointer items-center gap-2">
                      <input type="radio" name="medio" checked={medio === opcion} onChange={() => setMedio(opcion)} />
                      {opcion === 'EFECTIVO' ? 'Efectivo' : 'Tarjeta'}
                    </label>
                  ))}
                </div>
                {medio === 'EFECTIVO' ? (
                  <label className="flex items-center gap-3">
                    <span>Recibido</span>
                    <input
                      type="number"
                      min={0}
                      step="0.10"
                      value={recibido}
                      onChange={(evento) => setRecibido(evento.target.value)}
                      aria-label="Monto recibido"
                      className="w-32 rounded-lg border border-[var(--color-border-default)] px-3 py-1.5"
                    />
                    {recibido !== '' && Number(recibido) >= resumen.diferencia && (
                      <span>Vuelto: {formatCurrency(Number(recibido) - resumen.diferencia)}</span>
                    )}
                  </label>
                ) : (
                  <label className="flex items-center gap-3">
                    <span>Referencia del voucher</span>
                    <input
                      value={referencia}
                      onChange={(evento) => setReferencia(evento.target.value)}
                      aria-label="Referencia del voucher"
                      className="w-40 rounded-lg border border-[var(--color-border-default)] px-3 py-1.5 font-mono"
                    />
                  </label>
                )}
              </fieldset>
            )}
          </section>
        )}

        {error && <Alert tono="error">{error}</Alert>}
      </div>
    </Modal>
  )
}
