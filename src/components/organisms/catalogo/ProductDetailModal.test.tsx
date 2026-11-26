// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import ProductDetailModal from './ProductDetailModal'
import type { Product } from '../../../types'

const zapatilla: Product = {
  id: 'PROD-101',
  name: 'Zapatillas Velocity X',
  category: 'Running',
  price: 249,
  stock: 7,
  image: '',
  variants: [
    { sku: 'ZAPVEL-38-NEG', barcode: '', size: '38', color: 'Negro', stock: 4 },
    { sku: 'ZAPVEL-40-AZU', barcode: '', size: '40', color: 'Azul', stock: 3 },
  ],
}

afterEach(cleanup)

describe('ProductDetailModal (F2 · RF-05)', () => {
  it('agrega al carrito la talla y el color elegidos, con su propio SKU', () => {
    const onAdd = vi.fn()
    render(<ProductDetailModal product={zapatilla} onAdd={onAdd} onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Azul' }))
    fireEvent.click(screen.getByRole('button', { name: '40' }))
    fireEvent.click(screen.getByRole('button', { name: /Agregar al carrito/ }))

    expect(onAdd).toHaveBeenCalledTimes(1)
    const linea = onAdd.mock.calls[0][0] as Product
    expect(linea.id).toBe('ZAPVEL-40-AZU')
    expect(linea.variants).toEqual([zapatilla.variants![1]])
  })

  it('con datos de G6 sin stock muestra el semáforo sin cantidades y el precio de la talla (RF-06)', () => {
    const onAdd = vi.fn()
    const polo: Product = {
      id: 'P-1', name: 'Polo técnico Dry', category: 'Otros', price: 59.9, stock: 13, image: '', stockConocido: false,
      variants: [
        { sku: 'POLTEC-M-BLA', barcode: '', size: 'M', color: 'Blanco', stock: 10, price: 59.9, disponibilidad: 'DISPONIBLE', stockConocido: false },
        { sku: 'POLTEC-L-BLA', barcode: '', size: 'L', color: 'Blanco', stock: 3, price: 64.9, disponibilidad: 'ULTIMAS_UNIDADES', stockConocido: false },
      ],
    }
    render(<ProductDetailModal product={polo} onAdd={onAdd} onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'L' }))

    expect(screen.getByText('Últimas unidades')).toBeTruthy()
    expect(screen.queryByText(/Últimas 3 unidades|Stock: /)).toBeNull()
    expect(screen.getByText('S/ 64.90')).toBeTruthy()
    expect(screen.queryByText(/código/)).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Agregar al carrito/ }))
    expect((onAdd.mock.calls[0][0] as Product).price).toBe(64.9)
  })

  it('sin precio vigente no deja vender la variante', () => {
    const sinPrecio: Product = {
      id: 'P-2', name: 'Short', category: 'Otros', price: 0, stock: 10, image: '',
      variants: [{ sku: 'SHO-M', barcode: '', size: 'M', color: 'Negro', stock: 10, disponibilidad: 'DISPONIBLE', stockConocido: false }],
    }
    render(<ProductDetailModal product={sinPrecio} onAdd={vi.fn()} onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'M' }))

    expect(screen.getByText('Precio por confirmar')).toBeTruthy()
    expect((screen.getByRole('button', { name: /Sin precio vigente/ }) as HTMLButtonElement).disabled).toBe(true)
  })
})
