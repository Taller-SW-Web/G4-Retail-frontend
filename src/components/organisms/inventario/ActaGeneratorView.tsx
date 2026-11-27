import { useEffect, useState } from 'react'
import { IconFileCertificate } from '@tabler/icons-react'
import Button from '../../atoms/Button'
import Alert from '../../molecules/Alert'
import ConfirmDialog from '../../molecules/ConfirmDialog'
import EmptyState from '../../molecules/EmptyState'
import ActaPrintPreview from './ActaPrintPreview'
import { ApiError } from '../../../api/http'
import {
  emitirActa,
  listarCuarentena,
  puedeEntrarAlActa,
  type ActaEmitida,
  type IncidenciaCuarentena,
  type TipoDestino,
} from '../../../api/actasMermaApi'
import { DESTINOS, ETIQUETA_FALLA, etiquetaDestino, motivoParaNoEmitir } from '../../../lib/actaMerma'
import { formatFecha } from '../../../lib/format'

/** El acta recién emitida y el nombre de sus prendas, para imprimirla. */
interface ActaParaImprimir {
  acta: ActaEmitida
  nombres: Record<string, string>
}

/**
 * Liquidación de mermas de la tienda (F12 · RF-34).
 *
 * El supervisor marca las prendas en cuarentena que salen de la tienda, elige su destino y emite el
 * acta. Al emitirla, esas prendas salen de la bandeja (CA-RF34-01) y aparece el acta para imprimir.
 * Las prendas que Inventario todavía no aceptó (`PENDIENTE_REPORTE`) se muestran, pero no se pueden
 * marcar (contrato §5.12).
 */
export default function ActaGeneratorView() {
  const [prendas, setPrendas] = useState<IncidenciaCuarentena[]>([])
  const [cargando, setCargando] = useState(true)
  const [seleccionadas, setSeleccionadas] = useState<string[]>([])
  const [destino, setDestino] = useState<TipoDestino | null>(null)
  const [observaciones, setObservaciones] = useState('')
  const [aviso, setAviso] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [emitiendo, setEmitiendo] = useState(false)
  const [emitida, setEmitida] = useState<ActaParaImprimir | null>(null)

  useEffect(() => {
    listarCuarentena()
      .then(setPrendas)
      .catch((causa) =>
        setError(causa instanceof ApiError ? causa.message : 'No se pudo cargar la cuarentena de la tienda.'),
      )
      .finally(() => setCargando(false))
  }, [])

  const alternar = (id: string) =>
    setSeleccionadas((actual) => (actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id]))

  const elegibles = prendas.filter(puedeEntrarAlActa)
  const todasMarcadas = elegibles.length > 0 && seleccionadas.length === elegibles.length
  const alternarTodas = () => setSeleccionadas(todasMarcadas ? [] : elegibles.map((p) => p.incidenciaId))

  const pedirConfirmacion = () => {
    const motivo = motivoParaNoEmitir(seleccionadas, destino)
    setAviso(motivo)
    if (!motivo) setConfirmando(true)
  }

  const emitir = async () => {
    if (!destino) return
    setEmitiendo(true)
    setError(null)
    try {
      const notas = observaciones.trim()
      const acta = await emitirActa({
        incidenciasIds: seleccionadas,
        tipoDestino: destino,
        observaciones: notas || undefined,
      })
      setEmitida({
        acta,
        nombres: Object.fromEntries(prendas.map((p) => [p.incidenciaId, p.nombreProducto])),
      })
      setPrendas((actual) => actual.filter((p) => !seleccionadas.includes(p.incidenciaId)))
      setSeleccionadas([])
      setDestino(null)
      setObservaciones('')
    } catch (causa) {
      setError(causa instanceof ApiError ? causa.message : 'No se pudo emitir el acta. Intenta de nuevo.')
    } finally {
      setEmitiendo(false)
      setConfirmando(false)
    }
  }

  if (emitida) {
    return (
      <section aria-label="Acta emitida" className="flex flex-col gap-4">
        <Alert tono="success" title={`Acta ${emitida.acta.actaNumero} emitida`}>
          Las prendas pasaron a {emitida.acta.incidencias[0]?.estado} y salieron de la cuarentena.
        </Alert>
        <ActaPrintPreview acta={emitida.acta} nombres={emitida.nombres} />
        <Button variant="secondary" className="self-start" onClick={() => setEmitida(null)}>
          Volver a la cuarentena
        </Button>
      </section>
    )
  }

  return (
    <section aria-label="Liquidación de mermas" className="flex flex-col gap-4">
      {error && <Alert tono="error">{error}</Alert>}

      {cargando ? (
        <p role="status" className="text-sm text-[var(--color-text-secondary)]">
          Cargando prendas en cuarentena…
        </p>
      ) : prendas.length === 0 ? (
        <EmptyState
          title="No hay prendas en cuarentena"
          description="Cuando se reporte una prenda dañada o no ubicada, aparecerá aquí para incluirla en un acta."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border-default)] bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-surface-cloud)] text-xs uppercase text-[var(--color-text-secondary)]">
              <tr>
                <th className="p-3">
                  <input
                    type="checkbox"
                    aria-label="Seleccionar todas"
                    checked={todasMarcadas}
                    disabled={elegibles.length === 0}
                    onChange={alternarTodas}
                    className="h-4 w-4"
                  />
                </th>
                <th className="p-3">SKU</th>
                <th className="p-3">Prenda</th>
                <th className="p-3">Motivo</th>
                <th className="p-3">Reportada</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {prendas.map((prenda) => (
                <tr key={prenda.incidenciaId} className="border-t border-[var(--color-border-default)]">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      aria-label={`Incluir ${prenda.sku}`}
                      checked={seleccionadas.includes(prenda.incidenciaId)}
                      disabled={!puedeEntrarAlActa(prenda)}
                      onChange={() => alternar(prenda.incidenciaId)}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="p-3 font-mono text-xs">{prenda.sku}</td>
                  <td className="p-3">{prenda.nombreProducto}</td>
                  <td className="p-3">{ETIQUETA_FALLA[prenda.tipoFalla]}</td>
                  <td className="p-3">{formatFecha(prenda.fechaReporte)}</td>
                  <td className="p-3 text-xs">
                    {puedeEntrarAlActa(prenda) ? 'En cuarentena' : 'Esperando confirmación de Inventario'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <fieldset className="flex flex-col gap-2 rounded-2xl border border-[var(--color-border-default)] bg-white p-5 shadow-sm">
        <legend className="px-1 text-sm font-semibold">Destino de las prendas</legend>
        {DESTINOS.map(({ valor, etiqueta }) => (
          <label key={valor} className="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="radio"
              name="destino"
              checked={destino === valor}
              onChange={() => setDestino(valor)}
              className="h-4 w-4"
            />
            {etiqueta}
          </label>
        ))}
        <label className="mt-2 flex flex-col gap-1 text-sm">
          <span className="font-semibold">Observaciones (opcional)</span>
          <textarea
            value={observaciones}
            onChange={(evento) => setObservaciones(evento.target.value)}
            rows={2}
            className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-cloud)] px-3 py-2 outline-none focus:border-[var(--color-accent-signal)]"
          />
        </label>
      </fieldset>

      {aviso && <Alert tono="warning">{aviso}</Alert>}

      <Button className="gap-2 self-end" onClick={pedirConfirmacion} disabled={cargando}>
        <IconFileCertificate size={18} /> Emitir acta ({seleccionadas.length})
      </Button>

      {confirmando && destino && (
        <ConfirmDialog
          title="Emitir acta de merma"
          confirmLabel="Emitir acta"
          loading={emitiendo}
          onConfirm={emitir}
          onCancel={() => setConfirmando(false)}
        >
          Se emitirá el acta con {seleccionadas.length}{' '}
          {seleccionadas.length === 1 ? 'prenda' : 'prendas'} y destino «{etiquetaDestino(destino)}». Las
          prendas saldrán de la cuarentena de la tienda.
        </ConfirmDialog>
      )}
    </section>
  )
}
