// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import DeliveryModal from './DeliveryModal'
import { ApiError } from '../../../api/http'
import { confirmarEntrega, type PedidoPickup } from '../../../api/pickupApi'

vi.mock('../../../api/pickupApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../api/pickupApi')>()),
  confirmarEntrega: vi.fn(),
}))

const pedido: PedidoPickup = {
  pedidoId: 'PED-2026-08910',
  clienteNombre: 'María González',
  clienteDni: '45678912',
  anaquelUbicacion: 'Anaquel B-04',
  fechaArriboTienda: '2026-10-16T10:00:00Z',
  estado: 'LISTO_PARA_RECOJO',
  articulos: [{ sku: 'ZAP-RUN-41-BLANC', nombre: 'Zapatilla Running Pegasus 40', talla: '41', color: 'Blanco', cantidad: 1 }],
}

const botonConfirmar = () => screen.getByRole('button', { name: /Confirmar y Registrar Entrega/ })
const escribir = (etiqueta: RegExp, valor: string) => fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } })
const marcarVerificacion = () => fireEvent.click(screen.getByLabelText(/verificado físicamente/))

function montar() {
  const onEntregado = vi.fn()
  render(<DeliveryModal pedido={pedido} onEntregado={onEntregado} onClose={vi.fn()} />)
  return { onEntregado }
}

afterEach(() => {
  cleanup()
  vi.mocked(confirmarEntrega).mockReset()
})

describe('DeliveryModal (RF-19)', () => {
  it('retiro por titular autocompleta DNI y nombre de la compra', () => {
    montar()
    expect(screen.getByLabelText(/DNI de quien recoge/)).toHaveProperty('value', '45678912')
    expect(screen.getByLabelText(/Nombres completos/)).toHaveProperty('value', 'María González')
  })

  it('mantiene inactivo el botón sin checkbox de verificación ni código de retiro', () => {
    montar()
    expect(botonConfirmar()).toHaveProperty('disabled', true)

    escribir(/Código de retiro/, 'A7K2Q9')
    expect(botonConfirmar()).toHaveProperty('disabled', true)

    marcarVerificacion()
    expect(botonConfirmar()).toHaveProperty('disabled', false)
  })

  it('retiro por tercero limpia los campos y exige DNI de 8 dígitos', () => {
    montar()
    fireEvent.click(screen.getByRole('radio', { name: /Tercero Autorizado/ }))
    expect(screen.getByLabelText(/DNI de quien recoge/)).toHaveProperty('value', '')

    escribir(/DNI de quien recoge/, '1234')
    escribir(/Nombres completos/, 'Pedro Ramírez')
    escribir(/Código de retiro/, 'A7K2Q9')
    marcarVerificacion()
    expect(botonConfirmar()).toHaveProperty('disabled', true)

    escribir(/DNI de quien recoge/, '87654321')
    expect(botonConfirmar()).toHaveProperty('disabled', false)
  })

  it('confirma la entrega con el código de retiro y retira el pedido de la bandeja', async () => {
    vi.mocked(confirmarEntrega).mockResolvedValue({
      constanciaId: 'CONST-PED-2026-08910',
      fechaHoraEntrega: '2026-10-17T15:30:00Z',
      estado: 'ENTREGADO',
    })
    const { onEntregado } = montar()

    escribir(/Código de retiro/, 'a7k2q9')
    marcarVerificacion()
    fireEvent.click(botonConfirmar())

    await waitFor(() => expect(onEntregado).toHaveBeenCalledWith('PED-2026-08910'))
    expect(confirmarEntrega).toHaveBeenCalledWith('PED-2026-08910', {
      dniRecoge: '45678912',
      nombreRecoge: 'María González',
      esTerceroAutorizado: false,
      codigoRetiro: 'A7K2Q9',
    })
    expect(screen.getByText(/CONST-PED-2026-08910/)).toBeTruthy()
  })

  it('muestra el error del backend si el código de retiro no corresponde', async () => {
    vi.mocked(confirmarEntrega).mockRejectedValue(
      new ApiError(422, { code: 'CODIGO_RETIRO_INVALIDO', detail: 'El código de retiro no corresponde a este pedido' }),
    )
    const { onEntregado } = montar()

    escribir(/Código de retiro/, 'ZZZZZZ')
    marcarVerificacion()
    fireEvent.click(botonConfirmar())

    expect(await screen.findByText('El código de retiro no corresponde a este pedido')).toBeTruthy()
    expect(onEntregado).not.toHaveBeenCalled()
  })
})
