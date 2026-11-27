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
    expect(screen.getByText(/2 pedidos encontrados/)).toBeTruthy()
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

  it('RF-16-DOC: muestra el historial del cliente del más reciente al más antiguo', async () => {
    vi.mocked(buscarPedidos).mockResolvedValue({ ...pagina, items: [...pagina.items].reverse() })
    renderizar()

    buscarPor(/Por DNI\/RUC/, '72345678')

    expect(await screen.findByRole('heading', { name: 'Historial de DNI 72345678' })).toBeTruthy()
    const filas = screen.getAllByRole('row').slice(1)
    expect(filas.map((fila) => fila.querySelector('td')?.textContent)).toEqual(['PED-2026-00412', 'PED-2026-00377'])
    expect(screen.getByText(/del más reciente al más antiguo/)).toBeTruthy()
    expect(screen.getByText('Chatbot: 1')).toBeTruthy()
  })

  it('RF-16-DOC: reconoce un RUC de 11 dígitos', async () => {
    vi.mocked(buscarPedidos).mockResolvedValue({ ...pagina, total: 1, items: [pagina.items[0]] })
    renderizar()

    buscarPor(/Por DNI\/RUC/, '20601234567')

    expect(await screen.findByRole('heading', { name: 'Historial de RUC 20601234567' })).toBeTruthy()
    expect(buscarPedidos).toHaveBeenCalledWith({ documentoCliente: '20601234567' }, 0, 20)
  })

  it('RF-16-DOC: el campo de documento solo admite dígitos', () => {
    renderizar()

    fireEvent.click(screen.getByLabelText(/Por DNI\/RUC/))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '72.345-678' } })

    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('72345678')
  })

  it('RF-16-DOC: un cliente sin pedidos muestra el estado vacío', async () => {
    vi.mocked(buscarPedidos).mockRejectedValue(new ApiError(404, { code: 'PEDIDO_NO_ENCONTRADO' }))
    renderizar()

    buscarPor(/Por DNI\/RUC/, '45678912')

    expect(await screen.findByText('No hay pedidos registrados para el DNI 45678912. Verifica el documento o busca por código.')).toBeTruthy()
  })

  it('RF-16-DOC: si Ventas no autoriza la consulta por documento (A10) lo explica y ofrece buscar por código', async () => {
    vi.mocked(buscarPedidos).mockRejectedValue(
      new ApiError(403, { code: 'VENTAS_ACCESO_DENEGADO', detail: 'Ventas no autoriza la consulta' }),
    )
    renderizar()

    buscarPor(/Por DNI\/RUC/, '72345678')

    expect(await screen.findByText('Historial por documento no disponible')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Buscar por código' }))
    expect((screen.getByLabelText(/Por código de pedido/) as HTMLInputElement).checked).toBe(true)
  })

  it('un documento que el backend rechaza (400) marca el campo', async () => {
    vi.mocked(buscarPedidos).mockRejectedValue(
      new ApiError(400, {
        code: 'PARAMETRO_INVALIDO',
        detail: 'Parámetro inválido',
        errores: [{ campo: 'documentoCliente', motivo: 'El documento debe ser un DNI de 8 digitos o un RUC de 11' }],
      }),
    )
    renderizar()

    buscarPor(/Por DNI\/RUC/, '72345678')

    expect(await screen.findByText('El documento debe ser un DNI de 8 digitos o un RUC de 11')).toBeTruthy()
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
