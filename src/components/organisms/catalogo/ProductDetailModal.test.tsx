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
})
