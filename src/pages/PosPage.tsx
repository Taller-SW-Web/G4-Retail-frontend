import { useEffect, useRef, useState } from 'react'
import { IconMoodEmpty } from '@tabler/icons-react'
import { Spinner } from '../components/atoms/Spinner'
import { Alert } from '../components/molecules/Alert'
import { EmptyState } from '../components/molecules/EmptyState'
import { CartPanel } from '../components/organisms/CartPanel'
import { CatalogFilters, type FiltrosCatalogo } from '../components/organisms/CatalogFilters'
import { ProductCard } from '../components/organisms/ProductCard'
import { ProductDetailModal } from '../components/organisms/ProductDetailModal'
import { ScannerSimulator, type CodigoEjemplo } from '../components/organisms/ScannerSimulator'
import { buscarCatalogo } from '../services'
import { useAuthStore } from '../store/auth'
import { useEscaner } from '../lib/scanner'
import type { Producto } from '../types'

const DEBOUNCE_MS = 300
const SIN_FILTROS: FiltrosCatalogo = { query: '', disciplina: '', marca: '', categoria: '' }
const MAX_EJEMPLOS = 4

interface Seleccion {
  producto: Producto
  sku?: string
}

/** Primera variante con stock de cada producto, como códigos de prueba para el simulador. */
const codigosDePrueba = (productos: Producto[]): CodigoEjemplo[] =>
  productos.slice(0, MAX_EJEMPLOS).flatMap((p) => {
    const variante = p.variantes.find((v) => v.stockTienda > 0)
    return variante ? [{ codigo: variante.codigoBarras, etiqueta: `${p.nombre} · ${variante.talla} · ${variante.color}` }] : []
  })

/** F2 + F3 + F4: catálogo con búsqueda multicriterio y carrito de venta en mostrador. */
export function PosPage() {
  const tiendaId = useAuthStore((s) => s.usuario!.tiendaId)
  const [filtros, setFiltros] = useState(SIN_FILTROS)
  const [productos, setProductos] = useState<Producto[] | null>(null)
  const [error, setError] = useState(false)
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null)
  const [ejemplos, setEjemplos] = useState<CodigoEjemplo[]>([])
  const peticion = useRef(0)
  /** Código recién escaneado: su búsqueda se lanza sin debounce y abre la variante exacta. */
  const escaneado = useRef<string | null>(null)

  useEffect(() => {
    const codigo = escaneado.current
    escaneado.current = null
    const sinFiltros = Object.values(filtros).every((valor) => !valor)
    const temporizador = setTimeout(
      async () => {
        const id = ++peticion.current
        try {
          const { items } = await buscarCatalogo({ ...filtros, query: filtros.query.trim(), tiendaId })
          if (id !== peticion.current) return
          setProductos(items)
          setError(false)
          if (sinFiltros) setEjemplos(codigosDePrueba(items))
          if (!codigo) return
          const buscado = codigo.toLowerCase()
          for (const producto of items) {
            const variante = producto.variantes.find((v) => v.sku.toLowerCase() === buscado || v.codigoBarras === buscado)
            if (variante) return setSeleccion({ producto, sku: variante.sku })
          }
        } catch {
          if (id === peticion.current) setError(true)
        }
      },
      codigo || !filtros.query ? 0 : DEBOUNCE_MS,
    )
    return () => clearTimeout(temporizador)
  }, [filtros, tiendaId])

  function escanear(codigo: string) {
    if (!codigo.trim()) return
    escaneado.current = codigo.trim()
    setFiltros({ ...filtros, query: codigo.trim() })
  }
  useEscaner(escanear)

  function cerrarDetalle() {
    // Tras atender un escaneo, el buscador queda limpio para la siguiente lectura.
    if (seleccion?.sku) setFiltros((actuales) => ({ ...actuales, query: '' }))
    setSeleccion(null)
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4 md:h-full md:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] md:grid-rows-[minmax(0,1fr)] md:items-stretch">
      <section aria-labelledby="titulo-catalogo" className="flex flex-col gap-4 md:min-h-0">
        <h1 id="titulo-catalogo" className="sr-only">
          Catálogo
        </h1>
        <CatalogFilters filtros={filtros} onChange={setFiltros} onScan={escanear} />

        <div className="md:min-h-0 md:flex-1 md:overflow-y-auto">
          {error ? (
            <Alert tono="error" title="No se pudo cargar el catálogo">
              Revisa la conexión e intenta nuevamente.
            </Alert>
          ) : !productos ? (
            <div className="flex justify-center p-8" role="status" aria-label="Cargando catálogo">
              <Spinner size={24} />
            </div>
          ) : productos.length === 0 ? (
            <EmptyState icon={<IconMoodEmpty size={24} />} title="Sin resultados">
              No se encontraron productos con los criterios ingresados. Intente con otro término o retire los filtros
            </EmptyState>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {productos.map((producto) => (
                <ProductCard key={producto.productoId} producto={producto} onSelect={(p) => setSeleccion({ producto: p })} />
              ))}
            </div>
          )}
        </div>

        <ScannerSimulator ejemplos={ejemplos} />
      </section>

      <CartPanel />

      {seleccion && <ProductDetailModal producto={seleccion.producto} skuInicial={seleccion.sku} onClose={cerrarDetalle} />}
    </div>
  )
}
