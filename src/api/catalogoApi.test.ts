import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./http', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./http')>()),
  USA_MOCKS: false,
  api: { get: vi.fn() },
}))

import { api } from './http'
import { aProducto, listarCatalogo, type ProductoCatalogo } from './catalogoApi'

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
