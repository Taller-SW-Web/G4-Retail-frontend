/**
 * Catálogo de la tienda (F2 · RF-04, RF-05, RF-06).
 *
 * Ruta del contrato (`api-contracts.md` §5.2): `GET /api/v1/retail/catalogo`, paginada. La tienda
 * sale del perfil del vendedor. Los SKU que devuelve son los mismos con los que el backend valida
 * el precio al registrar la venta, por eso el POS no puede vender desde una lista propia.
 * Con `VITE_USE_MOCKS=true` se usa el catálogo semilla de la demo.
 */
import { products as catalogoSemilla } from '../data/products'
import type { Product, Variant } from '../types'
import { api, USA_MOCKS } from './http'

export type Disponibilidad = 'DISPONIBLE' | 'ULTIMAS_UNIDADES' | 'SOLO_ALMACEN_CENTRAL' | 'AGOTADO_TOTAL'

export interface VarianteCatalogo {
  sku: string
  talla: string
  color: string
  precio?: number
  disponibilidad: Disponibilidad
  stockTienda?: number | null
  enCuarentena: boolean
}

export interface ProductoCatalogo {
  productoId: string
  nombre: string
  marca?: string
  categoria: string
  disciplina?: string
  precio: number
  imagenUrl?: string | null
  variantes: VarianteCatalogo[]
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

/**
 * Unidades de referencia cuando Productos (G6) no informa el stock de la tienda: el POS solo las
 * usa para habilitar o bloquear la venta en pantalla; el backend valida la venta real.
 */
const STOCK_REFERENCIAL: Record<Disponibilidad, number> = {
  DISPONIBLE: 10,
  ULTIMAS_UNIDADES: 3,
  SOLO_ALMACEN_CENTRAL: 0,
  AGOTADO_TOTAL: 0,
}

const IMAGEN_GENERICA =
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80'

/** Imagen de respaldo por categoría, tomada del catálogo semilla, para artículos sin foto. */
const imagenPorCategoria = (categoria: string) =>
  catalogoSemilla.find((producto) => producto.category === categoria)?.image ?? IMAGEN_GENERICA

function categoriaDelMostrador(codigo: string): string {
  if (CATEGORIAS[codigo]) return CATEGORIAS[codigo]
  const nombre = codigo.replace(/^CAT-/, '').toLocaleLowerCase('es-PE')
  return nombre.charAt(0).toLocaleUpperCase('es-PE') + nombre.slice(1)
}

function stockDeVariante(variante: VarianteCatalogo): number {
  if (variante.enCuarentena) return 0
  return variante.stockTienda ?? STOCK_REFERENCIAL[variante.disponibilidad] ?? 0
}

const esTallaUnica = (talla: string) => /^[uú]nica$/i.test(talla.trim())

/** Convierte un artículo del contrato §5.2 al producto que muestra y vende el POS. */
export function aProducto(item: ProductoCatalogo): Product {
  const category = categoriaDelMostrador(item.categoria)
  const variants: Variant[] = item.variantes.map((variante) => ({
    sku: variante.sku,
    barcode: '',
    size: esTallaUnica(variante.talla) ? 'Única' : variante.talla,
    color: variante.color,
    stock: stockDeVariante(variante),
  }))
  const base = {
    name: item.nombre,
    category,
    price: item.precio,
    image: item.imagenUrl || imagenPorCategoria(category),
  }

  // Talla única: se vende directo con su SKU, sin abrir la matriz de tallas (RF-05).
  if (variants.length === 1 && esTallaUnica(item.variantes[0].talla)) {
    return { ...base, id: variants[0].sku, stock: variants[0].stock }
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
