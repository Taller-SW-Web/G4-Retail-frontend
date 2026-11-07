// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PickupPage from './PickupPage'
import { listarPickups, type PedidoPickup } from '../api/pickupApi'

vi.mock('../api/pickupApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/pickupApi')>()),
  listarPickups: vi.fn(),
}))

const base: Omit<PedidoPickup, 'pedidoId' | 'clienteNombre' | 'clienteDni'> = {
  anaquelUbicacion: 'Anaquel B-04',
  fechaArriboTienda: '2026-10-16T10:00:00Z',
  estado: 'LISTO_PARA_RECOJO',
  articulos: [],
}

afterEach(() => {
  cleanup()
  vi.mocked(listarPickups).mockReset()
})

describe('PickupPage (RF-18)', () => {
  it('busca por DNI o código aunque un pedido llegue sin DNI del cliente', async () => {
    vi.mocked(listarPickups).mockResolvedValue([
      { ...base, pedidoId: 'PED-2026-PICKUP01', clienteNombre: 'Cliente Sin DNI', clienteDni: null },
      { ...base, pedidoId: 'PED-2026-08910', clienteNombre: 'María González', clienteDni: '45678912' },
    ])
    render(
      <MemoryRouter>
        <PickupPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Cliente Sin DNI')).toBeTruthy()
    const buscador = screen.getByLabelText(/Busca por DNI/)

    fireEvent.change(buscador, { target: { value: 'pickup01' } })
    expect(screen.getByText('Cliente Sin DNI')).toBeTruthy()
    expect(screen.queryByText('María González')).toBeNull()

    fireEvent.change(buscador, { target: { value: '4567' } })
    expect(screen.getByText('María González')).toBeTruthy()
    expect(screen.queryByText('Cliente Sin DNI')).toBeNull()
  })
})
