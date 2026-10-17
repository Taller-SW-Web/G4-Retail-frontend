import { beforeEach, describe, expect, it } from 'vitest'
import { useCartStore } from './cart'
import type { Product } from '../types'

const productoTest: Product = {
  id: 'prod-001',
  name: 'Zapatilla Pegasus 40',
  category: 'Calzado',
  price: 299.9,
  stock: 3,
  image: '/pegasus.jpg',
}

describe('useCartStore (F4)', () => {
  beforeEach(() => {
    useCartStore.getState().vaciarCarrito()
    useCartStore.setState({ carritosEnEspera: [], cupon: '', cliente: null })
  })

  it('agrega un producto nuevo con cantidad 1', () => {
    const agregado = useCartStore.getState().agregarProducto(productoTest)

    expect(agregado).toBe(true)
    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0]?.quantity).toBe(1)
    expect(items[0]?.product.id).toBe('prod-001')
  })

  it('no permite exceder el stock físico local de la tienda', () => {
    useCartStore.getState().agregarProducto(productoTest) // 1
    useCartStore.getState().aumentarCantidad(productoTest.id) // 2
    useCartStore.getState().aumentarCantidad(productoTest.id) // 3 (stock límite)
    useCartStore.getState().aumentarCantidad(productoTest.id) // no debe pasar de 3

    const items = useCartStore.getState().items
    expect(items[0]?.quantity).toBe(3)
  })

  it('permite disminuir la cantidad y eliminar la prenda', () => {
    useCartStore.getState().agregarProducto(productoTest)
    useCartStore.getState().aumentarCantidad(productoTest.id) // 2
    useCartStore.getState().disminuirCantidad(productoTest.id) // 1

    expect(useCartStore.getState().items[0]?.quantity).toBe(1)

    useCartStore.getState().quitarProducto(productoTest.id)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('pausa la venta en espera con alias y limpia el mostrador para el siguiente cliente (RF-10)', () => {
    useCartStore.getState().agregarProducto(productoTest)
    const pausado = useCartStore.getState().pausarVenta('Probador 3 - Zapatillas Running')

    expect(pausado).toBe(true)
    expect(useCartStore.getState().items).toHaveLength(0)

    const enEspera = useCartStore.getState().carritosEnEspera
    expect(enEspera).toHaveLength(1)
    expect(enEspera[0]?.aliasTicket).toBe('Probador 3 - Zapatillas Running')
    expect(enEspera[0]?.items).toHaveLength(1)
  })

  it('reanuda una venta pausada si el mostrador está libre', () => {
    useCartStore.getState().agregarProducto(productoTest)
    useCartStore.getState().pausarVenta('Probador 1')

    const id = useCartStore.getState().carritosEnEspera[0]!.carritoEsperaId
    const reanudado = useCartStore.getState().reanudarVenta(id)

    expect(reanudado).toBe(true)
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().carritosEnEspera).toHaveLength(0)
  })

  it('no permite reanudar venta en espera si el mostrador ya tiene artículos', () => {
    useCartStore.getState().agregarProducto(productoTest)
    useCartStore.getState().pausarVenta('Probador 1')

    // Ahora agregamos un producto nuevo al mostrador
    useCartStore.getState().agregarProducto(productoTest)

    const id = useCartStore.getState().carritosEnEspera[0]!.carritoEsperaId
    const reanudado = useCartStore.getState().reanudarVenta(id)

    expect(reanudado).toBe(false)
    expect(useCartStore.getState().carritosEnEspera).toHaveLength(1)
  })
})
