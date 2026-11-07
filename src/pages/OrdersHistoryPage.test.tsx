// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OrdersHistoryPage from './OrdersHistoryPage'
import { buscarPedidos, obtenerPedido } from '../api/pedidoApi'
import { ApiError } from '../api/http'

vi.mock('../api/pedidoApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/pedidoApi')>()),
  buscarPedidos: vi.fn(),
  obtenerPedido: vi.fn(),
}))

const pagina = {
  page: 0,
  size: 20,
  total: 2,
  items: [
    { pedidoId: 'PED-2026-00412', canal: 'RETAIL', fechaCreacion: '2026-11-06T10:30:00-05:00', estadoComercial: 'ENTREGADO', total: 427 },
    { pedidoId: 'PED-2026-00377', canal: 'CHATBOT', fechaCreacion: '2026-11-01T08:00:00-05:00', estadoComercial: 'ANULADO', total: 249 },
  ],
}

const renderizar = (ruta = '/pedidos') =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <OrdersHistoryPage />
    </MemoryRouter>,
  )

const buscarPor = (criterio: RegExp, valor: string) => {
  fireEvent.click(screen.getByLabelText(criterio))
  fireEvent.change(screen.getByRole('textbox'), { target: { value: valor } })
  fireEvent.click(screen.getByRole('button', { name: /Buscar/ }))
}

afterEach(() => {
  cleanup()
  vi.mocked(buscarPedidos).mockReset()
  vi.mocked(obtenerPedido).mockReset()
})

describe('OrdersHistoryPage (RF-16)', () => {
  it('por DNI lista las compras del cliente con su estado', async () => {
    vi.mocked(buscarPedidos).mockResolvedValue(pagina)
    renderizar()

    buscarPor(/Por DNI\/RUC/, '72345678')

    expect(await screen.findByText('PED-2026-00412')).toBeTruthy()
    expect(buscarPedidos).toHaveBeenCalledWith({ documentoCliente: '72345678' }, 0, 20)
    expect(screen.getByText('2 pedidos encontrados')).toBeTruthy()
    expect(screen.getByText('Entregado', { selector: '[data-tone]' }).getAttribute('data-tone')).toBe('success')
    expect(screen.getByText('Tienda física')).toBeTruthy()
    expect(obtenerPedido).not.toHaveBeenCalled()
  })

  it('no consulta con un DNI mal escrito y explica el formato', () => {
    renderizar()

    buscarPor(/Por DNI\/RUC/, '7234')

    expect(screen.getByText('Ingresa un DNI de 8 dígitos o un RUC de 11.')).toBeTruthy()
    expect(buscarPedidos).not.toHaveBeenCalled()
  })

  it('por DNI/RUC avisa que solo busca las ventas de la sesión actual', async () => {
    vi.mocked(buscarPedidos).mockRejectedValue(new ApiError(404, { code: 'PEDIDO_NO_ENCONTRADO' }))
    renderizar()

    buscarPor(/Por DNI\/RUC/, '45678912')

    expect(screen.getByText(/Solo muestra las ventas hechas en el mostrador/)).toBeTruthy()
    expect(await screen.findByText(/no tiene ventas en la sesión actual/)).toBeTruthy()
  })

  it('un usuario sin perfil de tienda ve el aviso del 403', async () => {
    vi.mocked(buscarPedidos).mockRejectedValue(
      new ApiError(403, {
        code: 'FORBIDDEN_USUARIO_SIN_TIENDA',
        detail: 'El usuario autenticado no tiene un perfil activo en la tienda',
      }),
    )
    renderizar()

    buscarPor(/Por código de pedido/, 'PED-2026-00412')

    expect(await screen.findByText('No se pudo consultar los pedidos')).toBeTruthy()
    expect(obtenerPedido).not.toHaveBeenCalled()
  })

  it('un código inexistente muestra el estado vacío sin romper la pantalla', async () => {
    vi.mocked(buscarPedidos).mockRejectedValue(new ApiError(404, { code: 'PEDIDO_NO_ENCONTRADO' }))
    renderizar()

    buscarPor(/Por código de pedido/, 'PED-2026-99999')

    expect(await screen.findByText('No se encontraron órdenes con los criterios especificados.')).toBeTruthy()
  })

  it('un código exacto abre de inmediato el detalle del pedido', async () => {
    vi.mocked(buscarPedidos).mockResolvedValue({ ...pagina, total: 1, items: [pagina.items[0]] })
    vi.mocked(obtenerPedido).mockReturnValue(new Promise(() => {}))
    renderizar()

    buscarPor(/Por código de pedido/, 'PED-2026-00412')

    expect(await screen.findByRole('dialog', { name: 'Pedido PED-2026-00412' })).toBeTruthy()
    await waitFor(() => expect(obtenerPedido).toHaveBeenCalledWith('PED-2026-00412'))
  })

  it('llega con la búsqueda hecha desde la boleta (?codigo=)', async () => {
    vi.mocked(buscarPedidos).mockResolvedValue({ ...pagina, total: 1, items: [pagina.items[0]] })
    vi.mocked(obtenerPedido).mockReturnValue(new Promise(() => {}))
    renderizar('/pedidos?codigo=PED-2026-00412')

    expect(await screen.findByRole('dialog', { name: 'Pedido PED-2026-00412' })).toBeTruthy()
    expect(buscarPedidos).toHaveBeenCalledWith({ codigoPedido: 'PED-2026-00412' }, 0, 20)
  })
})
