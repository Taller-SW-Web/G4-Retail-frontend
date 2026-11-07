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
import { esDocumentoValido } from '../lib/pedidos'

type Criterio = 'codigo' | 'documento'

type Resultado =
  | { tipo: 'inicial' }
  | { tipo: 'cargando' }
  | { tipo: 'encontrado'; pagina: PaginaPedidos }
  | { tipo: 'sinResultados' }
  | { tipo: 'error'; mensaje: string }

const TAMANO_PAGINA = 20

const filtroDe = (criterio: Criterio, valor: string): FiltroPedidos =>
  criterio === 'codigo' ? { codigoPedido: valor.trim() } : { documentoCliente: valor.trim() }

/**
 * F6: Consulta y seguimiento histórico de pedidos (RF-16, RF-17). Ruta `/pedidos`.
 * Asignado a: KEVIN
 *
 * Por código exacto abre de inmediato el detalle; por DNI/RUC lista las compras del cliente.
 * Acepta `?codigo=` o `?documento=` para llegar con la búsqueda hecha (por ejemplo, desde la boleta).
 */
export default function OrdersHistoryPage() {
  const [parametros] = useSearchParams()
  const [criterio, setCriterio] = useState<Criterio>(parametros.get('documento') ? 'documento' : 'codigo')
  const [valor, setValor] = useState(parametros.get('documento') ?? parametros.get('codigo') ?? '')
  const [errorCampo, setErrorCampo] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Resultado>({ tipo: 'inicial' })
  const [ultimaBusqueda, setUltimaBusqueda] = useState<{ filtro: FiltroPedidos; page: number } | null>(null)
  const [detalle, setDetalle] = useState<string | null>(null)

  const ejecutar = useCallback(async (filtro: FiltroPedidos, page: number) => {
    setUltimaBusqueda({ filtro, page })
    setResultado({ tipo: 'cargando' })
    try {
      const pagina = await buscarPedidos(filtro, page, TAMANO_PAGINA)
      setResultado({ tipo: 'encontrado', pagina })
      // RF-16: un código exacto que existe abre el detalle sin pasos extra.
      if ('codigoPedido' in filtro && pagina.items.length === 1) setDetalle(pagina.items[0].pedidoId)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setResultado({ tipo: 'sinResultados' })
      else setResultado({ tipo: 'error', mensaje: err instanceof ApiError ? err.message : 'Revisa la conexión e intenta nuevamente.' })
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
  }

  const pagina = resultado.tipo === 'encontrado' ? resultado.pagina : null
  const totalPaginas = pagina ? Math.ceil(pagina.total / pagina.size) : 0

  return (
    <div className="min-h-screen bg-[var(--color-surface-cloud)] p-4 md:p-6">
      <header className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--color-border-default)] bg-white p-5 shadow-sm">
        <Link to="/pos">
          <Button variant="secondary" className="gap-2">
            <IconArrowLeft size={18} /> Volver al POS
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
                  'cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
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
                onChange={(e) => setValor(e.target.value)}
                placeholder={criterio === 'codigo' ? 'PED-2026-00412' : 'DNI de 8 dígitos o RUC de 11'}
                inputMode={criterio === 'documento' ? 'numeric' : 'text'}
                maxLength={criterio === 'documento' ? 11 : 40}
                autoFocus
                aria-invalid={!!errorCampo}
                aria-describedby={errorCampo ? 'busqueda-pedido-error' : undefined}
                className={[
                  'w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-sm outline-none focus:ring-2',
                  criterio === 'codigo' ? 'font-mono' : '',
                  errorCampo
                    ? 'border-[var(--color-error)] focus:ring-[var(--color-error-bg)]'
                    : 'border-[var(--color-border-default)] focus:border-[var(--color-accent-signal)] focus:ring-[var(--color-accent-signal-soft)]',
                ].join(' ')}
              />
              {errorCampo && (
                <p id="busqueda-pedido-error" className="text-sm text-[var(--color-error)]">
                  {errorCampo}
                </p>
              )}
            </div>
            <Button type="submit" className="gap-2 py-3" disabled={resultado.tipo === 'cargando'}>
              <IconSearch size={18} /> Buscar
            </Button>
          </div>
        </form>

        {resultado.tipo === 'inicial' && (
          <EmptyState
            icon={<IconSearch size={24} />}
            title="Consulta un pedido"
            description="Ingresa el código del pedido (PED-2026-00412) o el DNI/RUC del cliente para ver sus compras y su seguimiento."
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
            description="No se encontraron órdenes con los criterios especificados."
          />
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
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {pagina.total === 1 ? '1 pedido encontrado' : `${pagina.total} pedidos encontrados`}
            </p>
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
          </div>
        )}
      </main>

      {detalle && <OrderHistoryModal pedidoId={detalle} onClose={() => setDetalle(null)} />}
    </div>
  )
}
