// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import ProductCard from './ProductCard'
import type { Product } from '../../../types'

const base: Product = {
  id: 'P-1', name: 'Polo técnico Dry', category: 'Otros', price: 59.9, stock: 10, image: '',
  disponibilidad: 'DISPONIBLE', stockConocido: false,
}

afterEach(cleanup)

describe('ProductCard con datos de Productos G6 (F2 · RF-06)', () => {
  it('con stockTienda null muestra el estado y no un número inventado', () => {
    render(<ProductCard product={base} onAdd={vi.fn()} />)

    expect(screen.getByText('Disponible')).toBeTruthy()
    expect(screen.queryByText(/Stock: 10/)).toBeNull()
  })

  it('una prenda solo en el almacén central no se vende en mostrador', () => {
    render(<ProductCard product={{ ...base, stock: 0, disponibilidad: 'SOLO_ALMACEN_CENTRAL' }} onAdd={vi.fn()} />)

    expect(screen.getByText('Solo en almacén central')).toBeTruthy()
    expect((screen.getByRole('button', { name: /No disponible/ }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('sin precio vigente lo indica y no deja añadir', () => {
    render(<ProductCard product={{ ...base, price: 0 }} onAdd={vi.fn()} />)

    expect(screen.getByText('Precio por confirmar')).toBeTruthy()
    expect((screen.getByRole('button', { name: /Sin precio/ }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('si las tallas cuestan distinto muestra el precio "desde"', () => {
    const conTallas: Product = {
      ...base,
      variants: [
        { sku: 'A', barcode: '', size: 'M', color: 'Blanco', stock: 10, price: 59.9 },
        { sku: 'B', barcode: '', size: 'XL', color: 'Blanco', stock: 10, price: 64.9 },
      ],
    }
    render(<ProductCard product={conTallas} onAdd={vi.fn()} />)

    expect(screen.getByText('desde')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Elegir talla/ })).toBeTruthy()
  })

  it('con el catálogo semilla mantiene las unidades', () => {
    render(<ProductCard product={{ ...base, stock: 3, stockConocido: undefined, disponibilidad: undefined }} onAdd={vi.fn()} />)
    expect(screen.getByText('Últimas 3 unidades')).toBeTruthy()
  })
})
