import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./http', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./http')>()),
  USA_MOCKS: false,
  api: { get: vi.fn() },
}))

import { api } from './http'
import { aProducto, listarCatalogo, resolverCodigoBarras, type ProductoCatalogo } from './catalogoApi'

afterEach(() => vi.mocked(api.get).mockReset())

const zapatilla: ProductoCatalogo = {
  productoId: 'PROD-101',
  nombre: 'Zapatillas Velocity X',
  categoria: 'CAT-RUNNING',
  precio: 249,
  variantes: [
    { sku: 'ZAPVEL-38-NEG', talla: '38', color: 'Negro', disponibilidad: 'DISPONIBLE', enCuarentena: false, stockTienda: 4 },
    { sku: 'ZAPVEL-40-AZU', talla: '40', color: 'Azul', disponibilidad: 'ULTIMAS_UNIDADES', enCuarentena: false },
    { sku: 'ZAPVEL-42-AZU', talla: '42', color: 'Azul', disponibilidad: 'AGOTADO_TOTAL', enCuarentena: false },
    { sku: 'ZAPVEL-43-AZU', talla: '43', color: 'Azul', disponibilidad: 'DISPONIBLE', enCuarentena: true },
  ],
}

describe('catálogo de Retail (F2 · RF-04, RF-05, RF-06 · contrato §5.2)', () => {
  it('convierte el artículo del backend al producto del POS con sus variantes y SKU reales', () => {
    const producto = aProducto(zapatilla)

    expect(producto).toMatchObject({ id: 'PROD-101', name: 'Zapatillas Velocity X', category: 'Running', price: 249 })
    expect(producto.variants?.map((v) => v.sku)).toEqual(['ZAPVEL-38-NEG', 'ZAPVEL-40-AZU', 'ZAPVEL-42-AZU', 'ZAPVEL-43-AZU'])
    expect(producto.image).toMatch(/^https:\/\//)
  })

  it('usa el stock de la tienda o, si no llega, lo deriva de la disponibilidad (RF-06)', () => {
    const [disponible, ultimas, agotada] = aProducto(zapatilla).variants!

    expect(disponible.stock).toBe(4)
    expect(ultimas.stock).toBeGreaterThan(0)
    expect(agotada.stock).toBe(0)
  })

  it('no deja vender una variante en cuarentena (RF-33)', () => {
    const cuarentena = aProducto(zapatilla).variants![3]
    expect(cuarentena.stock).toBe(0)
  })

  it('el stock del artículo es la suma del de sus variantes', () => {
    const producto = aProducto(zapatilla)
    expect(producto.stock).toBe(producto.variants!.reduce((suma, v) => suma + v.stock, 0))
  })

  it('un artículo de talla única se vende directo con su SKU, sin matriz de tallas', () => {
    const mancuerna = aProducto({
      productoId: 'PROD-301',
      nombre: 'Mancuerna hexagonal 10 kg',
      categoria: 'CAT-GYM',
      precio: 129,
      imagenUrl: 'https://cdn.ejemplo/mancuerna.jpg',
      variantes: [{ sku: 'MANHEX-Unica-NEG', talla: 'Unica', color: 'Negro', disponibilidad: 'DISPONIBLE', enCuarentena: false }],
    })

    expect(mancuerna).toMatchObject({ id: 'MANHEX-Unica-NEG', category: 'Gym', image: 'https://cdn.ejemplo/mancuerna.jpg' })
    expect(mancuerna.variants).toBeUndefined()
    expect(mancuerna.stock).toBeGreaterThan(0)
  })

  it('traduce las categorías del backend a las del mostrador', () => {
    const categoria = (codigo: string) => aProducto({ ...zapatilla, categoria: codigo }).category
    expect(['CAT-ROPA', 'CAT-FUTBOL', 'CAT-BICI', 'CAT-ACCESORIOS', 'CAT-NUEVA'].map(categoria))
      .toEqual(['Ropa', 'Fútbol', 'Bici', 'Accesorios', 'Nueva'])
  })

  it('pide GET /api/v1/retail/catalogo y recorre todas las páginas', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ items: [zapatilla], page: 0, size: 1, total: 2 })
      .mockResolvedValueOnce({ items: [{ ...zapatilla, productoId: 'PROD-102' }], page: 1, size: 1, total: 2 })

    const productos = await listarCatalogo(1)

    expect(api.get).toHaveBeenNthCalledWith(1, '/api/v1/retail/catalogo?page=0&size=1')
    expect(api.get).toHaveBeenNthCalledWith(2, '/api/v1/retail/catalogo?page=1&size=1')
    expect(productos.map((p) => p.id)).toEqual(['PROD-101', 'PROD-102'])
  })
})

/** Artículo tal como lo arma el backend con Productos (G6) real: sin cantidades y con nulos. */
const deG6: ProductoCatalogo = {
  productoId: 'a1b2c3',
  nombre: 'Polo técnico Dry',
  marca: 'MAR-01',
  categoria: '3f2a1b4c-1111-2222-3333-444455556666',
  disciplina: null,
  precio: null,
  imagenUrl: null,
  variantes: [
    { sku: 'POLTEC-M-BLA', talla: 'M', color: 'Blanco', precio: 59.9, disponibilidad: 'DISPONIBLE', stockTienda: null, enCuarentena: false },
    { sku: 'POLTEC-L-BLA', talla: 'L', color: null, precio: 64.9, disponibilidad: 'ULTIMAS_UNIDADES', stockTienda: null, enCuarentena: false },
    { sku: 'POLTEC-XL-BLA', talla: 'XL', color: 'Blanco', precio: null, disponibilidad: 'AGOTADO_TOTAL', stockTienda: null, enCuarentena: false },
  ],
}

describe('catálogo con datos reales de Productos G6 (F2 · RF-06 · X-P0-03)', () => {
  it('con stockTienda null marca el stock como no conocido y no inventa cantidades visibles', () => {
    const producto = aProducto(deG6)

    expect(producto.stockConocido).toBe(false)
    expect(producto.variants!.every((v) => v.stockConocido === false)).toBe(true)
    expect(producto.variants!.map((v) => v.disponibilidad)).toEqual(['DISPONIBLE', 'ULTIMAS_UNIDADES', 'AGOTADO_TOTAL'])
    expect(producto.disponibilidad).toBe('DISPONIBLE')
  })

  it('una variante agotada no se vende aunque llegue un número de stock', () => {
    const producto = aProducto({
      ...deG6,
      variantes: [{ sku: 'X', talla: 'M', color: 'Negro', disponibilidad: 'SOLO_ALMACEN_CENTRAL', stockTienda: 5 }],
    })
    expect(producto.stock).toBe(0)
  })

  it('toma el precio por SKU y usa el menor como precio "desde" si el artículo no trae precio', () => {
    const producto = aProducto(deG6)

    expect(producto.price).toBe(59.9)
    expect(producto.variants!.map((v) => v.price)).toEqual([59.9, 64.9, undefined])
  })

  it('soporta talla, color, nombre, categoría y variantes nulos sin romper', () => {
    const producto = aProducto(deG6)
    expect(producto.category).toBe('Otros')
    expect(producto.image).toMatch(/^https:\/\//)
    expect(producto.variants![1].color).toBe('Estándar')

    const minimo = aProducto({ productoId: 'P-9', nombre: null, categoria: null, precio: null, variantes: null })
    expect(minimo).toMatchObject({ id: 'P-9', name: 'P-9', category: 'Otros', price: 0, stock: 0, disponibilidad: 'AGOTADO_TOTAL' })
  })

  it('una sola variante sin talla se vende como talla única con su precio', () => {
    const gorra = aProducto({
      ...deG6,
      variantes: [{ sku: 'GOR-U-NEG', talla: null, color: 'Negro', precio: 39.9, disponibilidad: 'DISPONIBLE', stockTienda: null }],
    })
    expect(gorra).toMatchObject({ id: 'GOR-U-NEG', price: 39.9, stockConocido: false })
    expect(gorra.variants).toBeUndefined()
  })

  it('un estado desconocido de G6 se trata como disponible, no como agotado', () => {
    const producto = aProducto({
      ...deG6,
      variantes: [{ sku: 'X', talla: 'M', color: 'Negro', disponibilidad: 'INDETERMINADO' as never, stockTienda: null }],
    })
    expect(producto.variants![0].disponibilidad).toBe('DISPONIBLE')
    expect(producto.stock).toBeGreaterThan(0)
  })
})

describe('lector de código de barras contra Retail (F2 · RF-04, contrato §5.2)', () => {
  const catalogo = [aProducto(deG6)]

  it('resuelve un EAN que el catálogo local no conoce con GET /catalogo/codigo-barras/{codigo}', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      codigoBarras: '7751234567890', productoId: 'a1b2c3', nombre: 'Polo técnico Dry', precio: 64.9,
      variante: { sku: 'POLTEC-L-BLA', talla: 'L', color: 'Blanco', disponibilidad: 'ULTIMAS_UNIDADES', stockTienda: null, enCuarentena: false },
    })

    const lectura = await resolverCodigoBarras(catalogo, '7751234567890')

    expect(api.get).toHaveBeenCalledWith('/api/v1/retail/catalogo/codigo-barras/7751234567890')
    expect(lectura?.variant).toMatchObject({ sku: 'POLTEC-L-BLA', barcode: '7751234567890' })
  })

  it('no consulta si lo leído no es un código de barras', async () => {
    expect(await resolverCodigoBarras(catalogo, 'POLTEC')).toBeNull()
    expect(api.get).not.toHaveBeenCalled()
  })

  it('un código desconocido (404) no agrega nada', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('404'))
    expect(await resolverCodigoBarras(catalogo, '7750000000000')).toBeNull()
  })
})
