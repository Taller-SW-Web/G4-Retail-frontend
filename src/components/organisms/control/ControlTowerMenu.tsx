import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { IconBell, IconCircleCheck, IconTag } from '@tabler/icons-react'
import Button from '../../atoms/Button'
import Alert from '../../molecules/Alert'
import EmptyState from '../../molecules/EmptyState'
import DeliveryModal from '../pickup/DeliveryModal'
import CriticalStockWidget from './CriticalStockWidget'
import PickupDayBoard from './PickupDayBoard'
import { ApiError } from '../../../api/http'
import type { PedidoPickup } from '../../../api/pickupApi'
import {
  INTERVALO_RESUMEN_MS,
  esVigente,
  listarCampanasVigentes,
  listarPickupsDelDia,
  listarStockCritico,
  obtenerResumen,
  totalAlertas,
  type CampanaVigente,
  type FuenteControl,
  type ResumenControl,
  type VarianteCritica,
} from '../../../api/controlApi'
import { formatFecha } from '../../../lib/format'
import { useCartStore } from '../../../store/cart'
import { etiquetaDescuento } from '../../molecules/PromoBanner'

type Pestana = 'stock' | 'pickups' | 'campanas'

type Carga<T> = { estado: 'cargando' } | { estado: 'listo'; datos: T } | { estado: 'error'; mensaje: string }

const NOMBRE_FUENTE: Record<FuenteControl, string> = {
  VENTAS_G5: 'Ventas (G5)',
  PRODUCTOS_G6: 'Productos (G6)',
}

const PESTANAS: { id: Pestana; etiqueta: string; contador: keyof ResumenControl }[] = [
  { id: 'stock', etiqueta: 'Stock', contador: 'stockCritico' },
  { id: 'pickups', etiqueta: 'Pickups de hoy', contador: 'pickupPendientes' },
  { id: 'campanas', etiqueta: 'Campañas', contador: 'campanasVigentes' },
]

const mensajeDe = (err: unknown) =>
  err instanceof ApiError ? err.message : 'Revisa la conexión e intenta nuevamente.'

/**
 * F11: torre de control del turno en la campana del encabezado del POS.
 *
 * El badge suma pickups, stock crítico y campañas del resumen, que se consulta cada 60 s
 * (contrato §5.11). El menú se divide en pestañas: semáforo de stock (RF-29), pickups del día con
 * acceso directo a la entrega (RF-30) y campañas vigentes con su cupón (RF-31).
 */
export default function ControlTowerMenu() {
  const [resumen, setResumen] = useState<ResumenControl | null>(null)
  const [abierto, setAbierto] = useState(false)
  const [pestana, setPestana] = useState<Pestana>('stock')
  const [stock, setStock] = useState<Carga<VarianteCritica[]>>({ estado: 'cargando' })
  const [pickups, setPickups] = useState<Carga<PedidoPickup[]>>({ estado: 'cargando' })
  const [campanas, setCampanas] = useState<Carga<CampanaVigente[]>>({ estado: 'cargando' })
  const [enEntrega, setEnEntrega] = useState<PedidoPickup | null>(null)
  const contenedor = useRef<HTMLDivElement>(null)
  const cuponActual = useCartStore((s) => s.cupon)
  const aplicarCupon = useCartStore((s) => s.aplicarCupon)

  const refrescarResumen = useCallback(() => {
    obtenerResumen()
      .then(setResumen)
      // Si el resumen falla se conserva el último: el badge no debe parpadear a cero.
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    refrescarResumen()
    const intervalo = setInterval(refrescarResumen, INTERVALO_RESUMEN_MS)
    return () => clearInterval(intervalo)
  }, [refrescarResumen])

  const cargar = useCallback((cual: Pestana) => {
    if (cual === 'stock') {
      setStock({ estado: 'cargando' })
      listarStockCritico().then((datos) => setStock({ estado: 'listo', datos }), (err) => setStock({ estado: 'error', mensaje: mensajeDe(err) }))
    } else if (cual === 'pickups') {
      setPickups({ estado: 'cargando' })
      listarPickupsDelDia().then((datos) => setPickups({ estado: 'listo', datos }), (err) => setPickups({ estado: 'error', mensaje: mensajeDe(err) }))
    } else {
      setCampanas({ estado: 'cargando' })
      listarCampanasVigentes().then((datos) => setCampanas({ estado: 'listo', datos }), (err) => setCampanas({ estado: 'error', mensaje: mensajeDe(err) }))
    }
  }, [])

  // Cada vez que se abre una pestaña se trae su lista fresca.
  useEffect(() => {
    if (abierto) cargar(pestana)
  }, [abierto, pestana, cargar])

  // Escape o un clic fuera cierran el menú.
  useEffect(() => {
    if (!abierto) return
    const alPulsar = (evento: KeyboardEvent) => evento.key === 'Escape' && setAbierto(false)
    const alClic = (evento: MouseEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false)
    }
    document.addEventListener('keydown', alPulsar)
    document.addEventListener('mousedown', alClic)
    return () => {
      document.removeEventListener('keydown', alPulsar)
      document.removeEventListener('mousedown', alClic)
    }
  }, [abierto])

  const total = totalAlertas(resumen)
  const caidas = resumen?.fuentesNoDisponibles ?? []

  const entregar = (pedido: PedidoPickup) => {
    setAbierto(false)
    setEnEntrega(pedido)
  }

  const alEntregar = (pedidoId: string) => {
    setPickups((actual) => (actual.estado === 'listo' ? { estado: 'listo', datos: actual.datos.filter((p) => p.pedidoId !== pedidoId) } : actual))
    refrescarResumen()
  }

  const reintentar = (
    <Button variant="secondary" onClick={() => cargar(pestana)}>
      Reintentar
    </Button>
  )

  const renderCarga = <T,>(carga: Carga<T>, contenido: (datos: T) => ReactNode) => {
    if (carga.estado === 'cargando') {
      return (
        <div role="status" aria-label="Cargando" className="flex flex-col gap-2">
          {[0, 1].map((fila) => (
            <div key={fila} className="h-16 animate-pulse rounded-lg bg-[var(--color-surface-cloud-subtle)]" />
          ))}
        </div>
      )
    }
    if (carga.estado === 'error') {
      return (
        <div className="flex flex-col items-start gap-2">
          <Alert tono="error" title="No se pudo cargar esta sección">
            {carga.mensaje}
          </Alert>
          {reintentar}
        </div>
      )
    }
    return contenido(carga.datos)
  }

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-haspopup="true"
        aria-expanded={abierto}
        aria-label={total > 0 ? `Torre de control: ${total} alertas` : 'Torre de control: sin alertas'}
        className="relative rounded-lg p-2 text-[var(--color-text-inverse)] hover:bg-[var(--color-surface-ink-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-signal)]"
      >
        <IconBell size={24} aria-hidden="true" />
        {total > 0 && (
          <span
            aria-hidden="true"
            data-testid="badge-alertas"
            className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-[var(--color-action-primary)] px-1 text-xs font-bold text-[var(--color-text-primary)]"
          >
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Torre de control del turno"
          className="absolute right-0 top-full z-30 mt-2 flex max-h-[80vh] w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-[var(--color-border-default)] bg-white text-[var(--color-text-primary)] shadow-lg"
        >
          <header className="border-b border-[var(--color-border-default)] px-4 pt-3">
            <h2 className="font-heading text-lg uppercase">Torre de control</h2>
            {resumen && (
              <p className="text-xs text-[var(--color-text-secondary)]">Actualizado {new Date(resumen.actualizadoEn).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</p>
            )}
            <div role="tablist" aria-label="Secciones de la torre de control" className="mt-2 flex gap-1">
              {PESTANAS.map(({ id, etiqueta, contador }) => {
                const valor = resumen?.[contador] as number | null | undefined
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={pestana === id}
                    onClick={() => setPestana(id)}
                    className={[
                      'flex items-center gap-1 border-b-2 px-2 py-2 text-sm font-semibold transition-colors',
                      pestana === id
                        ? 'border-[var(--color-accent-signal)] text-[var(--color-text-primary)]'
                        : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                    ].join(' ')}
                  >
                    {etiqueta}
                    {valor != null && (
                      <span className="rounded-full bg-[var(--color-surface-cloud-subtle)] px-1.5 text-xs tabular-nums">{valor}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </header>

          <div role="tabpanel" className="flex flex-col gap-3 overflow-y-auto p-3">
            {caidas.length > 0 && (
              <Alert tono="warning" title="Datos incompletos">
                Sin respuesta de {caidas.map((f) => NOMBRE_FUENTE[f] ?? f).join(' y ')}. Los contadores de esa fuente no se muestran.
              </Alert>
            )}

            {pestana === 'stock' && renderCarga(stock, (datos) => <CriticalStockWidget variantes={datos} />)}

            {pestana === 'pickups' && renderCarga(pickups, (datos) => <PickupDayBoard pedidos={datos} onEntregar={entregar} />)}

            {pestana === 'campanas' &&
              renderCarga(campanas, (datos) => {
                const vigentes = datos.filter((c) => esVigente(c))
                if (vigentes.length === 0) {
                  return (
                    <EmptyState icon={<IconTag size={24} />} title="Sin campañas vigentes" description="Hoy no hay promociones activas para la tienda." />
                  )
                }
                return (
                  <ul className="flex flex-col gap-2">
                    {vigentes.map((campana) => {
                      const aplicado = !!campana.codigoCupon && cuponActual === campana.codigoCupon
                      const descuento = etiquetaDescuento(campana)
                      return (
                        <li key={campana.campanaId} className="flex flex-col gap-2 rounded-lg border border-[var(--color-border-default)] p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold">{campana.titulo}</p>
                              {campana.descripcion && <p className="text-xs text-[var(--color-text-secondary)]">{campana.descripcion}</p>}
                            </div>
                            {descuento && (
                              <span className="shrink-0 rounded-full bg-[var(--color-accent-volt)] px-2 py-1 text-xs font-bold tabular-nums">{descuento}</span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--color-text-secondary)]">Vigente hasta el {formatFecha(campana.vigenteHasta)}</p>
                          {campana.codigoCupon ? (
                            <Button
                              variant={aplicado ? 'secondary' : 'primary'}
                              className="gap-2"
                              disabled={aplicado}
                              onClick={() => aplicarCupon(campana.codigoCupon!)}
                            >
                              {aplicado ? <IconCircleCheck size={20} aria-hidden="true" /> : <IconTag size={20} aria-hidden="true" />}
                              {aplicado ? `Cupón ${campana.codigoCupon} aplicado` : `Aplicar cupón ${campana.codigoCupon}`}
                            </Button>
                          ) : (
                            <p className="text-xs font-semibold">Se aplica sin cupón.</p>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )
              })}
          </div>
        </div>
      )}

      {/* El encabezado del POS es oscuro: el modal recupera el color de texto base. */}
      {enEntrega && (
        <div className="text-[var(--color-text-primary)]">
          <DeliveryModal pedido={enEntrega} onClose={() => setEnEntrega(null)} onEntregado={alEntregar} />
        </div>
      )}
    </div>
  )
}
