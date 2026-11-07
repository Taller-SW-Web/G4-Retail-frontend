// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useCartStore } from '../../../store/cart'
import type { Product } from '../../../types'
import CartPanel from './CartPanel'

const producto: Product = {
  id: 'prod-001',
  name: 'Zapatilla de prueba',
  category: 'Calzado',
  price: 100,
  stock: 3,
  image: '/zapatilla.jpg',
}

afterEach(() => {
  cleanup()
  useCartStore.setState({ items: [], cliente: null, cupon: '', carritosEnEspera: [] })
  localStorage.removeItem('inka-retail-held-carts')
})

it('permite editar la cantidad y conserva el límite de stock (RF-10)', () => {
  useCartStore.getState().agregarProducto(producto)
  render(<CartPanel />)

  const cantidad = screen.getByRole('spinbutton', { name: `Cantidad de ${producto.name}` })
  fireEvent.change(cantidad, { target: { value: '2' } })
  expect(useCartStore.getState().items[0]?.quantity).toBe(2)

  fireEvent.change(cantidad, { target: { value: '4' } })
  fireEvent.blur(cantidad)
  expect(cantidad).toHaveProperty('value', '2')
  expect(useCartStore.getState().items[0]?.quantity).toBe(2)

  fireEvent.change(cantidad, { target: { value: '' } })
  fireEvent.blur(cantidad)
  expect(cantidad).toHaveProperty('value', '2')

  fireEvent.change(cantidad, { target: { value: '3' } })
  expect(useCartStore.getState().items[0]?.quantity).toBe(3)
  expect(screen.getByRole('button', { name: `Aumentar cantidad de ${producto.name}` })).toHaveProperty('disabled', true)
})

describe('Carrito en espera (RF-10 y RF-12)', () => {
  it('libera el mostrador y recupera el importe con descuento al reanudar', () => {
    useCartStore.getState().agregarProducto(producto)
    render(<CartPanel />)

    fireEvent.change(screen.getByLabelText('Cupón de descuento'), { target: { value: 'VERANO2026' } })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(screen.getByText('S/ 90.00')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Pausar' }))
    fireEvent.change(screen.getByLabelText('Identificador o alias de la venta'), { target: { value: 'Probador 3' } })
    fireEvent.click(screen.getByRole('button', { name: 'Pausar y Liberar POS' }))

    const carritoGuardado = localStorage.getItem('inka-retail-held-carts')
    expect(screen.getByRole('button', { name: 'Proceder al Cobro' })).toHaveProperty('disabled', true)
    fireEvent.click(screen.getByRole('button', { name: 'En Espera (1)' }))
    expect(screen.getByText('Probador 3')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Reanudar' }))

    expect(screen.getByText('S/ 90.00')).toBeTruthy()
    expect(screen.getByText('VERANO2026 (-10%)')).toBeTruthy()
    expect(carritoGuardado).toContain('"cupon":"VERANO2026"')
  })

  it('reanuda un carrito anterior sin cupón con el importe original', () => {
    useCartStore.setState({
      carritosEnEspera: [{
        carritoEsperaId: 'carrito-anterior',
        aliasTicket: 'Probador 2',
        items: [{ product: producto, quantity: 1 }],
        cliente: null,
        fechaHoraInicio: '2026-11-06T14:00:00Z',
        expiracion: '2026-11-06T16:00:00Z',
      }],
    })
    render(<CartPanel />)

    fireEvent.click(screen.getByRole('button', { name: 'En Espera (1)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reanudar' }))

    expect(useCartStore.getState().cupon).toBe('')
    expect(screen.getAllByText('S/ 100.00').length).toBeGreaterThan(0)
  })
})
