import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { IconArrowLeft, IconSearch, IconZoomExclamation } from '@tabler/icons-react'
import Button from '../components/atoms/Button'
import Alert from '../components/molecules/Alert'
import EmptyState from '../components/molecules/EmptyState'
import OrderHistoryModal from '../components/organisms/historial/OrderHistoryModal'
import OrderHistoryTable from '../components/organisms/historial/OrderHistoryTable'
import { ApiError } from '../api/http'
import { buscarPedidos, type FiltroPedidos, type PaginaPedidos } from '../api/pedidoApi'
import { useEnfoqueInicial } from '../hooks/useEnfoqueInicial'
import { esDocumentoValido, etiquetaCanal, etiquetaDocumento, ordenarDelMasReciente, pedidosPorCanal } from '../lib/pedidos'

type Criterio = 'codigo' | 'documento'

type Resultado =
  | { tipo: 'inicial' }
  | { tipo: 'cargando' }
  | { tipo: 'encontrado'; pagina: PaginaPedidos }
  | { tipo: 'sinResultados' }
  | { tipo: 'accesoDenegado' }
  | { tipo: 'error'; mensaje: string }

const TAMANO_PAGINA = 20

/** El 403 por falta de perfil de tienda aplica a cualquier búsqueda; no es la restricción A10 de Ventas. */
const SIN_PERFIL_DE_TIENDA = 'FORBIDDEN_USUARIO_SIN_TIENDA'

const filtroDe = (criterio: Criterio, valor: string): FiltroPedidos =>
  criterio === 'codigo' ? { codigoPedido: valor.trim() } : { documentoCliente: valor.trim() }

const soloDigitos = (valor: string) => valor.replace(/\D/g, '').slice(0, 11)

/**
 * F6: Consulta y seguimiento histórico de pedidos (RF-16, RF-16-DOC, RF-17). Ruta `/pedidos`.
 * Asignado a: KEVIN
 *
 * Por código exacto abre de inmediato el detalle. Por DNI/RUC muestra el historial del cliente en
 * todos los canales, del más reciente al más antiguo, y cada fila abre el mismo detalle con
 * `OrderTrackingCard` y `OrderTimeline` (contrato §5.6, `documentoCliente`). Si Ventas no autoriza
 * la consulta por documento (A10), lo dice y ofrece buscar por código.
 * Acepta `?codigo=` o `?documento=` para llegar con la búsqueda hecha (por ejemplo, desde la boleta).
 */
export default function OrdersHistoryPage() {
  const [parametros] = useSearchParams()
  const [criterio, setCriterio] = useState<Criterio>(parametros.get('documento') ? 'documento' : 'codigo')
  const [valor, setValor] = useState(parametros.get('documento') ?? parametros.get('codigo') ?? '')
  const campoBusqueda = useEnfoqueInicial<HTMLInputElement>()
  const [errorCampo, setErrorCampo] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Resultado>({ tipo: 'inicial' })
  const [ultimaBusqueda, setUltimaBusqueda] = useState<{ filtro: FiltroPedidos; page: number } | null>(null)
  const [detalle, setDetalle] = useState<string | null>(null)

  const ejecutar = useCallback(async (filtro: FiltroPedidos, page: number) => {
    setUltimaBusqueda({ filtro, page })
    setResultado({ tipo: 'cargando' })
    try {
      const pagina = await buscarPedidos(filtro, page, TAMANO_PAGINA)
      setResultado({ tipo: 'encontrado', pagina: { ...pagina, items: ordenarDelMasReciente(pagina.items) } })
      // RF-16: un código exacto que existe abre el detalle sin pasos extra.
      if ('codigoPedido' in filtro && pagina.items.length === 1) setDetalle(pagina.items[0].pedidoId)
    } catch (err) {
      if (!(err instanceof ApiError)) {
        setResultado({ tipo: 'error', mensaje: 'Revisa la conexión e intenta nuevamente.' })
      } else if (err.status === 404) {
        setResultado({ tipo: 'sinResultados' })
      } else if (err.status === 403 && 'documentoCliente' in filtro && err.codigo !== SIN_PERFIL_DE_TIENDA) {
        setResultado({ tipo: 'accesoDenegado' })
      } else if (err.status === 400) {
        // El backend valida igual que la pantalla; si aun así rechaza el dato, se marca el campo.
        setResultado({ tipo: 'inicial' })
        setErrorCampo(err.problema.errores?.[0]?.motivo ?? err.message)
      } else {
        setResultado({ tipo: 'error', mensaje: err.message })
      }
    }
  }, [])

  // Búsqueda que llega en la URL (por ejemplo, "Ver en historial" desde la boleta).
  useEffect(() => {
    const inicial = parametros.get('documento') ?? parametros.get('codigo')
    if (inicial) void ejecutar(filtroDe(parametros.get('documento') ? 'documento' : 'codigo', inicial), 0)
    // Solo al entrar a la pantalla.
  }, [])

  const validar = (): string | null => {
    if (!valor.trim()) return criterio === 'codigo' ? 'Ingresa el código del pedido.' : 'Ingresa el DNI o RUC del cliente.'
    if (criterio === 'documento' && !esDocumentoValido(valor)) return 'Ingresa un DNI de 8 dígitos o un RUC de 11.'
    return null
  }

  const buscar = (evento: FormEvent) => {
    evento.preventDefault()
    const problema = validar()
    setErrorCampo(problema)
    if (!problema) void ejecutar(filtroDe(criterio, valor), 0)
  }

  const cambiarCriterio = (nuevo: Criterio) => {
    setCriterio(nuevo)
    setErrorCampo(null)
    if (nuevo === 'documento') setValor((actual) => soloDigitos(actual))
  }

  const pagina = resultado.tipo === 'encontrado' ? resultado.pagina : null
  const totalPaginas = pagina ? Math.ceil(pagina.total / pagina.size) : 0
  const documentoBuscado =
    ultimaBusqueda && 'documentoCliente' in ultimaBusqueda.filtro ? ultimaBusqueda.filtro.documentoCliente : null

  return (
    <div className="min-h-screen bg-[var(--color-surface-cloud)] p-4 md:p-6">
      <header className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--color-border-default)] bg-white p-5 shadow-sm">
        <Link to="/pos">
          <Button variant="secondary" className="gap-2">
            <IconArrowLeft size={20} aria-hidden="true" /> Volver al POS
          </Button>
        </Link>
        <h1 className="font-heading text-2xl font-bold uppercase text-[var(--color-text-primary)]">Consulta de pedidos</h1>
      </header>

      <main className="flex flex-col gap-6">
        <form
          onSubmit={buscar}
          noValidate
          className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border-default)] bg-white p-5 shadow-sm"
        >
          <fieldset className="flex flex-wrap gap-2">
            <legend className="mb-2 text-sm font-semibold">Buscar</legend>
            {(
              [
                ['codigo', 'Por código de pedido'],
                ['documento', 'Por DNI/RUC'],
              ] as const
            ).map(([opcion, etiqueta]) => (
              <label
                key={opcion}
                className={[
                  'cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--color-accent-signal)]',
                  criterio === opcion
                    ? 'border-[var(--color-surface-ink)] bg-[var(--color-surface-ink)] text-[var(--color-text-inverse)]'
                    : 'border-[var(--color-border-default)] bg-white hover:bg-[var(--color-surface-cloud-subtle)]',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="criterio"
                  value={opcion}
                  checked={criterio === opcion}
                  onChange={() => cambiarCriterio(opcion)}
                  className="sr-only"
                />
                {etiqueta}
              </label>
            ))}
          </fieldset>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="busqueda-pedido" className="sr-only">
                {criterio === 'codigo' ? 'Código de pedido' : 'DNI o RUC del cliente'}
              </label>
              <input
                id="busqueda-pedido"
                value={valor}
                onChange={(e) => setValor(criterio === 'documento' ? soloDigitos(e.target.value) : e.target.value)}
                placeholder={criterio === 'codigo' ? 'PED-2026-00412' : 'DNI de 8 dígitos o RUC de 11'}
                inputMode={criterio === 'documento' ? 'numeric' : 'text'}
                maxLength={criterio === 'documento' ? 11 : 40}
                ref={campoBusqueda}
                aria-invalid={!!errorCampo}
                aria-describedby={
                  errorCampo ? 'busqueda-pedido-error' : criterio === 'documento' ? 'busqueda-pedido-alcance' : undefined
                }
                className={[
                  'w-full rounded-lg border bg-white px-4 py-3 text-sm shadow-sm outline-none focus:ring-2',
                  criterio === 'codigo' ? 'font-mono' : 'tabular-nums',
                  errorCampo
                    ? 'border-[var(--color-error)] focus:ring-[var(--color-error-bg)]'
                    : 'border-[var(--color-border-default)] focus:border-transparent focus:ring-[var(--color-accent-signal)]',
                ].join(' ')}
              />
              {criterio === 'documento' && !errorCampo && (
                <p id="busqueda-pedido-alcance" className="text-sm text-[var(--color-text-secondary)]">
                  Verás las compras del cliente en la tienda, la web y el chatbot, de la más reciente a la más antigua.
                </p>
              )}
              {errorCampo && (
                <p id="busqueda-pedido-error" className="flex items-center gap-1 text-sm text-[var(--color-error)]">
                  <IconZoomExclamation size={16} aria-hidden="true" />
                  {errorCampo}
                </p>
              )}
            </div>
            <Button type="submit" className="gap-2 py-3" disabled={resultado.tipo === 'cargando'}>
              <IconSearch size={20} aria-hidden="true" /> Buscar
            </Button>
          </div>
        </form>

        {resultado.tipo === 'inicial' && (
          <EmptyState
            icon={<IconSearch size={24} />}
            title="Consulta un pedido"
            description="Ingresa el código del pedido (PED-2026-00412) para ver su seguimiento, o el DNI/RUC del cliente para ver su historial de compras."
          />
        )}

        {resultado.tipo === 'cargando' && (
          <div role="status" aria-label="Buscando pedidos" className="flex flex-col gap-2">
            {[0, 1, 2].map((fila) => (
              <div key={fila} className="h-14 animate-pulse rounded-xl bg-[var(--color-surface-cloud-subtle)]" />
            ))}
          </div>
        )}

        {resultado.tipo === 'sinResultados' && (
          <EmptyState
            icon={<IconZoomExclamation size={24} />}
            title="Sin resultados"
            description={
              documentoBuscado
                ? `No hay pedidos registrados para el ${etiquetaDocumento(documentoBuscado)}. Verifica el documento o busca por código.`
                : 'No se encontraron órdenes con los criterios especificados.'
            }
          />
        )}

        {resultado.tipo === 'accesoDenegado' && (
          <div className="flex flex-col items-start gap-3">
            <Alert tono="warning" title="Historial por documento no disponible">
              Ventas (G5) aún no autoriza a la tienda a consultar pedidos por DNI/RUC. Puedes buscar cada pedido por su código.
            </Alert>
            <Button variant="secondary" className="gap-2" onClick={() => cambiarCriterio('codigo')}>
              <IconSearch size={20} aria-hidden="true" /> Buscar por código
            </Button>
          </div>
        )}

        {resultado.tipo === 'error' && (
          <div className="flex flex-col items-start gap-3">
            <Alert tono="error" title="No se pudo consultar los pedidos">
              {resultado.mensaje}
            </Alert>
            <Button
              variant="secondary"
              onClick={() => ultimaBusqueda && void ejecutar(ultimaBusqueda.filtro, ultimaBusqueda.page)}
            >
              Reintentar
            </Button>
          </div>
        )}

        {pagina && (
          <section aria-label={documentoBuscado ? 'Historial del cliente' : 'Pedidos encontrados'} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                {documentoBuscado && (
                  <h2 className="font-heading text-xl uppercase text-[var(--color-text-primary)]">
                    Historial de {etiquetaDocumento(documentoBuscado)}
                  </h2>
                )}
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {pagina.total === 1 ? '1 pedido encontrado' : `${pagina.total} pedidos encontrados`}
                  {documentoBuscado && pagina.total > 1 ? ' · del más reciente al más antiguo' : ''}
                </p>
              </div>
              {documentoBuscado && (
                <ul aria-label="Pedidos por canal en esta página" className="flex flex-wrap gap-2">
                  {pedidosPorCanal(pagina.items).map(({ canal, cantidad }) => (
                    <li
                      key={canal}
                      className="rounded-full bg-[var(--color-surface-cloud-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text-primary)]"
                    >
                      {etiquetaCanal(canal)}: {cantidad}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <OrderHistoryTable pedidos={pagina.items} onVerDetalle={setDetalle} />
            {totalPaginas > 1 && ultimaBusqueda && (
              <nav aria-label="Paginación" className="flex items-center justify-end gap-2">
                <Button
                  variant="secondary"
                  disabled={pagina.page === 0}
                  onClick={() => void ejecutar(ultimaBusqueda.filtro, pagina.page - 1)}
                >
                  Anterior
                </Button>
                <span className="text-sm">
                  Página {pagina.page + 1} de {totalPaginas}
                </span>
                <Button
                  variant="secondary"
                  disabled={pagina.page + 1 >= totalPaginas}
                  onClick={() => void ejecutar(ultimaBusqueda.filtro, pagina.page + 1)}
                >
                  Siguiente
                </Button>
              </nav>
            )}
          </section>
        )}
      </main>

      {detalle && <OrderHistoryModal pedidoId={detalle} onClose={() => setDetalle(null)} />}
    </div>
  )
}
