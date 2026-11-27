/**
 * Catálogo de la tienda (F2 · RF-04, RF-05, RF-06).
 *
 * Ruta del contrato (`api-contracts.md` §5.2): `GET /api/v1/retail/catalogo`, paginada. La tienda
 * sale del perfil del vendedor. Los SKU que devuelve son los mismos con los que el backend valida
 * el precio al registrar la venta, por eso el POS no puede vender desde una lista propia.
 * Con `VITE_USE_MOCKS=true` se usa el catálogo semilla de la demo.
 */
import { products as catalogoSemilla } from '../data/products'
import type { Disponibilidad, Product, Variant } from '../types'
import { api, USA_MOCKS } from './http'

export type { Disponibilidad }

/**
 * Variante tal como llega de Retail. Con Productos (G6) real, `talla`, `color`, `precio` y
 * `stockTienda` pueden venir `null`: la UI no debe romperse ni inventar datos por eso (RF-06).
 */
export interface VarianteCatalogo {
  sku: string
  talla?: string | null
  color?: string | null
  precio?: number | null
  disponibilidad?: Disponibilidad | null
  stockTienda?: number | null
  enCuarentena?: boolean | null
}

export interface ProductoCatalogo {
  productoId: string
  nombre?: string | null
  marca?: string | null
  categoria?: string | null
  disciplina?: string | null
  precio?: number | null
  imagenUrl?: string | null
  variantes?: VarianteCatalogo[] | null
}

interface PaginaCatalogo {
  items: ProductoCatalogo[]
  page: number
  size: number
  total: number
}

const CATEGORIAS: Record<string, string> = {
  'CAT-RUNNING': 'Running',
  'CAT-ROPA': 'Ropa',
  'CAT-GYM': 'Gym',
  'CAT-FUTBOL': 'Fútbol',
  'CAT-BICI': 'Bici',
  'CAT-ACCESORIOS': 'Accesorios',
}

const SIN_CATEGORIA = 'Otros'

/**
 * Tope referencial de unidades cuando Productos (G6) no informa el stock de la tienda: el POS solo
 * lo usa para habilitar o bloquear la venta y limitar la línea; no se muestra como cantidad. El
 * backend valida la venta real.
 */
const STOCK_REFERENCIAL: Record<Disponibilidad, number> = {
  DISPONIBLE: 10,
  ULTIMAS_UNIDADES: 3,
  SOLO_ALMACEN_CENTRAL: 0,
  AGOTADO_TOTAL: 0,
}

/** Orden del semáforo, del mejor al peor estado. */
const PRIORIDAD: Disponibilidad[] = ['DISPONIBLE', 'ULTIMAS_UNIDADES', 'SOLO_ALMACEN_CENTRAL', 'AGOTADO_TOTAL']

const IMAGEN_GENERICA =
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80'

/** Imagen de respaldo por categoría, tomada del catálogo semilla, para artículos sin foto. */
const imagenPorCategoria = (categoria: string) =>
  catalogoSemilla.find((producto) => producto.category === categoria)?.image ?? IMAGEN_GENERICA

const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function categoriaDelMostrador(codigo?: string | null): string {
  const limpio = codigo?.trim()
  // G6 puede enviar el identificador interno de la categoría: no es un nombre que se pueda mostrar.
  if (!limpio || ES_UUID.test(limpio)) return SIN_CATEGORIA
  if (CATEGORIAS[limpio]) return CATEGORIAS[limpio]
  const nombre = limpio.replace(/^CAT-/, '').replace(/[-_]+/g, ' ').toLocaleLowerCase('es-PE')
  return nombre.charAt(0).toLocaleUpperCase('es-PE') + nombre.slice(1)
}

/** Un estado que Retail no conoce se trata como disponible: G6 aclara que lo indeterminado no es agotado. */
const disponibilidadDe = (variante: VarianteCatalogo): Disponibilidad =>
  variante.disponibilidad && PRIORIDAD.includes(variante.disponibilidad) ? variante.disponibilidad : 'DISPONIBLE'

function stockDeVariante(variante: VarianteCatalogo): number {
  if (variante.enCuarentena) return 0
  const disponibilidad = disponibilidadDe(variante)
  // Un SKU agotado o solo en el almacén central no se vende en mostrador aunque llegue un número.
  if (STOCK_REFERENCIAL[disponibilidad] === 0) return 0
  return variante.stockTienda ?? STOCK_REFERENCIAL[disponibilidad]
}

const esTallaUnica = (talla?: string | null) => !talla?.trim() || /^[uú]nica$/i.test(talla.trim())

const precioValido = (precio?: number | null): precio is number => typeof precio === 'number' && precio > 0

/** El mejor estado entre las variantes: si una talla está disponible, el artículo lo está. */
const mejorDisponibilidad = (variantes: Variant[]): Disponibilidad =>
  PRIORIDAD.find((estado) => variantes.some((v) => v.disponibilidad === estado)) ?? 'AGOTADO_TOTAL'

/** Convierte un artículo del contrato §5.2 al producto que muestra y vende el POS. */
export function aProducto(item: ProductoCatalogo): Product {
  const category = categoriaDelMostrador(item.categoria)
  const variantes = item.variantes ?? []
  const variants: Variant[] = variantes.map((variante) => ({
    sku: variante.sku,
    barcode: '',
    size: esTallaUnica(variante.talla) ? 'Única' : variante.talla!.trim(),
    color: variante.color?.trim() || 'Estándar',
    stock: stockDeVariante(variante),
    ...(precioValido(variante.precio) ? { price: variante.precio } : {}),
    disponibilidad: variante.enCuarentena ? 'AGOTADO_TOTAL' : disponibilidadDe(variante),
    stockConocido: variante.stockTienda != null,
    ...(variante.enCuarentena ? { enCuarentena: true } : {}),
  }))

  // El precio del artículo es el "desde": el menor de sus variantes si el backend no lo envía.
  const preciosVariantes = variants.flatMap((v) => (v.price != null ? [v.price] : []))
  const price = precioValido(item.precio) ? item.precio : preciosVariantes.length ? Math.min(...preciosVariantes) : 0

  const base = {
    name: item.nombre?.trim() || item.productoId,
    category,
    price,
    image: item.imagenUrl || imagenPorCategoria(category),
    disponibilidad: mejorDisponibilidad(variants),
    stockConocido: variants.length > 0 && variants.every((v) => v.stockConocido),
  }

  // Talla única: se vende directo con su SKU, sin abrir la matriz de tallas (RF-05).
  if (variants.length === 1 && variants[0].size === 'Única') {
    const [unica] = variants
    return {
      ...base,
      id: unica.sku,
      price: unica.price ?? price,
      stock: unica.stock,
      disponibilidad: unica.disponibilidad,
      ...(unica.enCuarentena ? { enCuarentena: true } : {}),
    }
  }

  return { ...base, id: item.productoId, stock: variants.reduce((suma, v) => suma + v.stock, 0), variants }
}

/** RF-04: catálogo completo de la tienda, recorriendo todas las páginas del contrato. */
export async function listarCatalogo(tamanio = 100): Promise<Product[]> {
  if (USA_MOCKS) return catalogoSemilla

  const productos: Product[] = []
  for (let page = 0; ; page++) {
    const pagina = await api.get<PaginaCatalogo>(`/api/v1/retail/catalogo?page=${page}&size=${tamanio}`)
    productos.push(...pagina.items.map(aProducto))
    if (pagina.items.length === 0 || productos.length >= pagina.total) return productos
  }
}

/** Respuesta de `GET /api/v1/retail/catalogo/codigo-barras/{codigo}` (contrato §5.2). */
export interface LecturaCodigoBarras {
  codigoBarras: string
  productoId: string
  nombre?: string | null
  precio?: number | null
  variante: VarianteCatalogo
}

/** EAN-13 / Code128 numérico, como valida el backend. */
export const esCodigoBarras = (codigo: string) => /^\d{8,14}$/.test(codigo.trim())

/**
 * RF-04: resuelve en Retail un código de barras que el catálogo local no conoce. Con Productos (G6)
 * real las variantes no traen su EAN (G6 solo lo resuelve a SKU), así que el lector depende de esta
 * consulta. Devuelve el producto y la variante del catálogo cargado, o `null` si no corresponde a
 * ninguno.
 */
export async function resolverCodigoBarras(
  productos: Product[],
  codigo: string,
): Promise<{ product: Product; variant?: Variant } | null> {
  if (USA_MOCKS || !esCodigoBarras(codigo)) return null
  let lectura: LecturaCodigoBarras
  try {
    lectura = await api.get<LecturaCodigoBarras>(`/api/v1/retail/catalogo/codigo-barras/${encodeURIComponent(codigo.trim())}`)
  } catch {
    // 404 CODIGO_BARRAS_NO_ENCONTRADO o sin conexión: el lector no agrega nada.
    return null
  }
  const sku = lectura.variante?.sku
  for (const product of productos) {
    if (product.id === sku) return { product }
    const variant = product.variants?.find((v) => v.sku === sku)
    if (variant) return { product, variant: { ...variant, barcode: lectura.codigoBarras } }
  }
  return null
}
