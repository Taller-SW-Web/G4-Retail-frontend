// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OrderHistoryModal from './OrderHistoryModal'
import { obtenerPedido, type DetallePedido } from '../../../api/pedidoApi'
import { ApiError } from '../../../api/http'

vi.mock('../../../api/pedidoApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../api/pedidoApi')>()),
  obtenerPedido: vi.fn(),
}))

const base: DetallePedido = {
  pedidoId: 'PED-2026-00398',
  canal: 'MARKETPLACE',
  estadoComercial: 'DESPACHADO',
  modalidad: 'DOMICILIO',
  cliente: { nombre: 'Juan Pérez Torres', tipoDocumento: 'DNI', numeroDocumento: '72345678' },
  total: 178,
  fechaCreacion: '2026-11-01T08:00:00-05:00',
  lineas: [{ sku: 'TOPPRO-M-NEG', nombre: 'Top de compresión Pro', cantidad: 2, precioUnitario: 89, subtotal: 178 }],
  historialEstados: [
    { estado: 'CREADO', fecha: '2026-11-01T08:00:00-05:00' },
    { estado: 'PAGADO', fecha: '2026-11-01T08:05:00-05:00' },
    { estado: 'EN_PREPARACION', fecha: '2026-11-01T12:00:00-05:00' },
    { estado: 'DESPACHADO', fecha: '2026-11-02T09:00:00-05:00' },
  ],
}

const abrir = (pedido: DetallePedido) => {
  vi.mocked(obtenerPedido).mockResolvedValue(pedido)
  render(
    <MemoryRouter>
      <OrderHistoryModal pedidoId={pedido.pedidoId} onClose={() => {}} />
    </MemoryRouter>,
  )
}

const pasos = () =>
  within(screen.getByRole('list', { name: 'Línea de tiempo del pedido' }))
    .getAllByRole('listitem')
    .map((li) => li.getAttribute('data-situacion'))

afterEach(() => {
  cleanup()
  vi.mocked(obtenerPedido).mockReset()
})

describe('OrderHistoryModal (RF-17)', () => {
  it('muestra el estado con su badge de color y la línea de tiempo con el nodo en curso', async () => {
    abrir(base)

    const badge = await screen.findByText('Despachado', { selector: '[data-tone]' })
    expect(badge.getAttribute('data-tone')).toBe('info')
    expect(pasos()).toEqual(['completado', 'completado', 'completado', 'actual', 'pendiente'])
    const linea = screen.getByRole('list', { name: 'Línea de tiempo del pedido' })
    expect(within(linea).getByText('01/11/2026 08:00')).toBeTruthy()
  })

  it('desglosa las prendas con talla y color del catálogo y su subtotal', async () => {
    abrir(base)

    const fila = (await screen.findByText('Top de compresión Pro')).closest('tr') as HTMLElement
    expect(within(fila).getByText('M · Negro')).toBeTruthy()
    expect(within(fila).getByText('S/ 178.00')).toBeTruthy()
  })

  it('corta la línea con un nodo rojo si el pedido se anuló', async () => {
    abrir({
      ...base,
      estadoComercial: 'ANULADO',
      historialEstados: [
        { estado: 'CREADO', fecha: '2026-11-01T08:00:00-05:00' },
        { estado: 'ANULADO', fecha: '2026-11-01T09:00:00-05:00', motivo: 'Solicitado por el cliente' },
      ],
    })

    const badge = await screen.findByText('Anulado', { selector: '[data-tone]' })
    expect(badge.getAttribute('data-tone')).toBe('error')
    expect(pasos()).toEqual(['completado', 'anulado'])
    expect(screen.getByText('Motivo: Solicitado por el cliente')).toBeTruthy()
  })

  it('en un pedido pickup muestra la tienda y el aviso de recojo', async () => {
    abrir({ ...base, modalidad: 'RECOJO_TIENDA', tiendaId: 'TIENDA-MIRAFLORES', estadoComercial: 'EN_PREPARACION' })

    expect(await screen.findByText('Recojo en tienda')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ir a la bandeja Pickup' }).getAttribute('href')).toBe('/pickup')
  })

  it('si Ventas no responde, avisa sin romper la pantalla', async () => {
    vi.mocked(obtenerPedido).mockRejectedValue(new ApiError(503, { code: 'VENTAS_NO_DISPONIBLE', detail: 'Ventas no respondió a tiempo' }))
    render(
      <MemoryRouter>
        <OrderHistoryModal pedidoId="PED-2026-00398" onClose={() => {}} />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Ventas no respondió a tiempo')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy()
  })
})
