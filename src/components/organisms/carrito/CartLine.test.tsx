// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { CartItem } from '../../../types'
import CartLine from './CartLine'

const item: CartItem = {
  product: { id: 'CAM-RUN', name: 'Camiseta Running', category: 'Ropa', price: 129.9, stock: 5, image: '',
    variants: [{ sku: 'CAM-RUN-M-AZUL', barcode: '', size: 'M', color: 'Azul', stock: 5 }] },
  quantity: 1,
}

afterEach(() => cleanup())

describe('CartLine — precio con promoción (RF-11)', () => {
  it('tacha el precio regular y muestra el rebajado cuando la línea tiene descuento', () => {
    render(<CartLine item={item} linea={{ sku: 'CAM-RUN-M-AZUL', cantidad: 1, precioUnitario: 129.9, descuento: 12.99,
      precioFinal: 116.91, promocionAplicada: '10% Cupón VERANO2026' }} />)

    expect(screen.getByLabelText('Precio regular').tagName).toBe('S')
    expect(screen.getByLabelText('Precio regular').textContent).toContain('129.90')
    expect(screen.getByLabelText('Precio con descuento').textContent).toContain('116.91')
    expect(screen.getByText('10% Cupón VERANO2026')).toBeTruthy()
  })

  it('sin descuento muestra solo el importe normal', () => {
    render(<CartLine item={item} linea={{ sku: 'CAM-RUN-M-AZUL', cantidad: 1, precioUnitario: 129.9, descuento: 0, precioFinal: 129.9 }} />)

    expect(screen.queryByLabelText('Precio regular')).toBeNull()
    expect(screen.getByText('S/ 129.90', { selector: 'span' })).toBeTruthy()
  })

  it('mientras recalcula otra cantidad no muestra una rebaja que ya no corresponde', () => {
    render(<CartLine item={{ ...item, quantity: 2 }} linea={{ sku: 'CAM-RUN-M-AZUL', cantidad: 1, precioUnitario: 129.9,
      descuento: 12.99, precioFinal: 116.91 }} />)

    expect(screen.queryByLabelText('Precio regular')).toBeNull()
  })
})
