// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { ApiError, api } from '../../../api/http'
import PaymentModal from './PaymentModal'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  sessionStorage.clear()
})

function montarCobro() {
  render(<MemoryRouter><PaymentModal
    total={100}
    cliente={{ id: 'sin-doc', nombre: 'Cliente general', tipoDocumento: 'SIN_DOCUMENTO', numeroDocumento: '' }}
    items={[{ sku: 'POLO-M', nombre: 'Polo', talla: 'M', color: 'Blanco', cantidad: 1, precioUnitario: 100 }]}
    vendedor="VEN-001" terminalPos="POS-01" turnoId="turno-1"
    onClose={vi.fn()} onVentaConfirmada={vi.fn()}
  /></MemoryRouter>)
}

it('RF-13: efectivo menor al total bloquea el cobro y el monto exacto lo habilita', () => {
  const post = vi.spyOn(api, 'post')
  montarCobro()
  const confirmar = screen.getByRole('button', { name: 'Confirmar Pago y Finalizar' })
  fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '99.99' } })
  expect(confirmar).toHaveProperty('disabled', true)
  fireEvent.click(confirmar)
  expect(post).not.toHaveBeenCalled()
  fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '100' } })
  expect(confirmar).toHaveProperty('disabled', false)
})

it('RF-13: tarjeta exige referencia y cambiar de medio limpia los datos anteriores', () => {
  montarCobro()
  fireEvent.click(screen.getByRole('button', { name: 'Tarjeta / POS' }))
  const confirmar = screen.getByRole('button', { name: 'Confirmar Pago y Finalizar' })
  expect(confirmar).toHaveProperty('disabled', true)
  fireEvent.change(screen.getByPlaceholderText('OP-983120'), { target: { value: 'OP-1234' } })
  expect(confirmar).toHaveProperty('disabled', false)
  fireEvent.click(screen.getByRole('button', { name: 'Efectivo' }))
  expect(screen.getByPlaceholderText('0.00')).toHaveProperty('value', '')
  expect(confirmar).toHaveProperty('disabled', true)
  fireEvent.click(screen.getByRole('button', { name: 'Tarjeta / POS' }))
  expect(screen.getByPlaceholderText('OP-983120')).toHaveProperty('value', '')
})

it('reintenta el mismo cobro y guarda la boleta emitida por Retail', async () => {
  // Cada clic hace un intento y un reintento automático: los dos primeros 503 agotan el primer clic.
  const post = vi.spyOn(api, 'post')
    .mockRejectedValueOnce(new ApiError(503, { detail: 'Ventas no confirmó el cobro' }))
    .mockRejectedValueOnce(new ApiError(503, { detail: 'Ventas no confirmó el cobro' }))
    .mockResolvedValueOnce({
      pedidoId: 'PED-2026-00412',
      pago: { medioPago: 'EFECTIVO', montoRecibido: 59.9, vuelto: 0 },
      comprobante: {
        tipo: 'BOLETA', serie: 'B001', correlativo: '00000045', subtotal: 50.76,
        igv: 9.14, total: 59.9, fechaEmision: '2026-11-06T18:00:00Z', qr: 'qr-backend',
      },
      items: [{ sku: 'POLTEC-M-BLA', cantidad: 1, precioFinal: 59.9 }],
    })
  const confirmar = vi.fn()
  render(<MemoryRouter><PaymentModal
    total={59.9}
    cliente={{ id: 'sin-doc', nombre: 'Cliente general', tipoDocumento: 'SIN_DOCUMENTO', numeroDocumento: '' }}
    items={[{ sku: 'POLTEC-M-BLA', nombre: 'Polo', talla: 'M', color: 'Blanco', cantidad: 1, precioUnitario: 59.9 }]}
    vendedor="VEN-001"
    terminalPos="POS-01"
    turnoId="bbbbbbbb-0000-0000-0000-000000000002"
    onClose={vi.fn()}
    onVentaConfirmada={confirmar}
  /></MemoryRouter>)

  fireEvent.click(screen.getByRole('button', { name: 'Exacto' }))
  const boton = screen.getByRole('button', { name: 'Confirmar Pago y Finalizar' })
  fireEvent.click(boton)
  await screen.findByText('Ventas no confirmó el cobro', undefined, { timeout: 4000 })
  expect(post).toHaveBeenCalledTimes(2)
  expect(sessionStorage.getItem('f5_ultima_venta')).toBeNull()
  fireEvent.click(boton)
  await waitFor(() => expect(confirmar).toHaveBeenCalledOnce())
  expect(post).toHaveBeenCalledTimes(3)
  expect(post.mock.calls[0]).toEqual(post.mock.calls[1])
  expect(post.mock.calls[0]).toEqual(post.mock.calls[2])
  expect(post.mock.calls[0][0]).toBe('/api/v1/retail/ventas')
  expect(JSON.parse(sessionStorage.getItem('f5_ultima_venta') ?? '{}')).toMatchObject({
    pedidoId: 'PED-2026-00412', serie: 'B001', correlativo: '00000045', qr: 'qr-backend',
  })
})
