// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PedidoPickup } from '../../../api/pickupApi'
import PickupDayBoard from './PickupDayBoard'

const pedido = (pedidoId: string, clienteNombre: string, clienteDni: string | null, anaquelUbicacion: string): PedidoPickup => ({
  pedidoId,
  clienteNombre,
  clienteDni,
  anaquelUbicacion,
  fechaArriboTienda: '2026-11-26T14:00:00Z',
  estado: 'LISTO_PARA_RECOJO',
  articulos: [{ sku: 'TOPPRO-M-NEG', nombre: 'Top de compresión Pro', talla: 'M', color: 'Negro', cantidad: 2 }],
})

const PEDIDOS = [
  pedido('PED-2026-00431', 'María González', '45678912', 'Anaquel A-12'),
  pedido('PED-2026-00427', 'Juan Pérez Torres', '72345678', 'Anaquel B-04'),
  pedido('PED-2026-00419', 'Rosa Quispe Huamán', null, 'Anaquel C-01'),
]

afterEach(cleanup)

describe('PickupDayBoard (F11 · RF-30)', () => {
  it('lista los paquetes con cliente, DNI, código y anaquel', () => {
    render(<PickupDayBoard pedidos={PEDIDOS} onEntregar={vi.fn()} />)

    expect(screen.getByText('3 paquetes')).toBeTruthy()
    const tarjeta = screen.getByText('María González').closest('li') as HTMLElement
    expect(within(tarjeta).getByText('Anaquel A-12')).toBeTruthy()
    expect(within(tarjeta).getByText(/DNI 45678912/)).toBeTruthy()
    expect(within(tarjeta).getByText('PED-2026-00431')).toBeTruthy()
    expect(screen.getByText(/DNI no registrado/)).toBeTruthy()
  })

  it('filtrar por DNI aísla la tarjeta del cliente de inmediato', () => {
    render(<PickupDayBoard pedidos={PEDIDOS} onEntregar={vi.fn()} />)
    const filtro = screen.getByLabelText('Filtrar por DNI del cliente')

    fireEvent.change(filtro, { target: { value: '7234' } })

    expect(screen.queryByText('María González')).toBeNull()
    expect(screen.getByText('Juan Pérez Torres')).toBeTruthy()
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })

  it('el filtro solo admite dígitos', () => {
    render(<PickupDayBoard pedidos={PEDIDOS} onEntregar={vi.fn()} />)
    const filtro = screen.getByLabelText('Filtrar por DNI del cliente') as HTMLInputElement

    fireEvent.change(filtro, { target: { value: 'ab45-67' } })

    expect(filtro.value).toBe('4567')
  })

  it('un DNI sin paquetes muestra el estado vacío', () => {
    render(<PickupDayBoard pedidos={PEDIDOS} onEntregar={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Filtrar por DNI del cliente'), { target: { value: '11111111' } })

    expect(screen.getByText('Sin coincidencias')).toBeTruthy()
  })

  it('"Entregar paquete" abre la entrega del pedido elegido', () => {
    const onEntregar = vi.fn()
    render(<PickupDayBoard pedidos={PEDIDOS} onEntregar={onEntregar} />)
    const tarjeta = screen.getByText('Juan Pérez Torres').closest('li') as HTMLElement

    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Entregar paquete' }))

    expect(onEntregar).toHaveBeenCalledWith(PEDIDOS[1])
  })

  it('sin paquetes indica que no hay nada por entregar', () => {
    render(<PickupDayBoard pedidos={[]} onEntregar={vi.fn()} />)
    expect(screen.getByText('Sin paquetes por entregar')).toBeTruthy()
  })
})
