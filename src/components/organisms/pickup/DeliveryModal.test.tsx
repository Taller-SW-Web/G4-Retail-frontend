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

function montar(datos: PedidoPickup = pedido) {
  const onEntregado = vi.fn()
  render(<DeliveryModal pedido={datos} onEntregado={onEntregado} onClose={vi.fn()} />)
  return { onEntregado }
}

afterEach(() => {
  cleanup()
  vi.mocked(confirmarEntrega).mockReset()
})

describe('DeliveryModal (RF-19)', () => {
  it('retiro por titular autocompleta el nombre y pide digitar el DNI del documento', () => {
    montar()
    expect(screen.getByLabelText(/DNI de quien recoge/)).toHaveProperty('value', '')
    expect(screen.getByLabelText(/Nombres completos/)).toHaveProperty('value', 'María González')
  })

  it('habilita el botón con DNI del titular y verificación, sin exigir código de retiro', () => {
    montar()
    expect(botonConfirmar()).toHaveProperty('disabled', true)

    escribir(/DNI de quien recoge/, '45678912')
    expect(botonConfirmar()).toHaveProperty('disabled', true)

    marcarVerificacion()
    expect(botonConfirmar()).toHaveProperty('disabled', false)
  })

  it('avisa y bloquea si el DNI no es el del titular', () => {
    montar()
    escribir(/DNI de quien recoge/, '11112222')
    marcarVerificacion()

    expect(screen.getByRole('alert').textContent).toMatch(/No coincide con el DNI del titular/)
    expect(botonConfirmar()).toHaveProperty('disabled', true)
  })

  it('bloquea la entrega como titular si el pedido no tiene DNI registrado', () => {
    montar({ ...pedido, clienteDni: null })
    expect(screen.getByText(/no tiene DNI del titular registrado/)).toBeTruthy()

    escribir(/DNI de quien recoge/, '45678912')
    marcarVerificacion()
    expect(botonConfirmar()).toHaveProperty('disabled', true)

    fireEvent.click(screen.getByRole('radio', { name: /Tercero Autorizado/ }))
    expect(screen.queryByText(/no tiene DNI del titular registrado/)).toBeNull()
  })

  it('retiro por tercero exige DNI de 8 dígitos y carta poder verificada', () => {
    montar()
    fireEvent.click(screen.getByRole('radio', { name: /Tercero Autorizado/ }))
    expect(screen.getByLabelText(/DNI de quien recoge/)).toHaveProperty('value', '')

    escribir(/DNI de quien recoge/, '1234')
    escribir(/Nombres completos/, 'Pedro Ramírez')
    marcarVerificacion()
    expect(botonConfirmar()).toHaveProperty('disabled', true)

    escribir(/DNI de quien recoge/, '87654321')
    expect(botonConfirmar()).toHaveProperty('disabled', true)

    fireEvent.click(screen.getByLabelText(/carta poder/))
    expect(botonConfirmar()).toHaveProperty('disabled', false)
  })

  it('confirma la entrega del titular y retira el pedido de la bandeja', async () => {
    vi.mocked(confirmarEntrega).mockResolvedValue({
      constanciaId: 'CONST-PED-2026-08910',
      fechaHoraEntrega: '2026-10-17T15:30:00Z',
      estado: 'ENTREGADO',
    })
    const { onEntregado } = montar()

    escribir(/DNI de quien recoge/, '45678912')
    marcarVerificacion()
    fireEvent.click(botonConfirmar())

    await waitFor(() => expect(onEntregado).toHaveBeenCalledWith('PED-2026-08910'))
    expect(confirmarEntrega).toHaveBeenCalledWith('PED-2026-08910', {
      dniRecoge: '45678912',
      nombreRecoge: 'María González',
      esTerceroAutorizado: false,
    })
    expect(screen.getByText(/CONST-PED-2026-08910/)).toBeTruthy()
  })

  it('envía la carta poder y el código de retiro cuando recoge un tercero', async () => {
    vi.mocked(confirmarEntrega).mockResolvedValue({
      constanciaId: 'CONST-PED-2026-08910',
      fechaHoraEntrega: '2026-10-17T15:30:00Z',
      estado: 'ENTREGADO',
    })
    montar()

    fireEvent.click(screen.getByRole('radio', { name: /Tercero Autorizado/ }))
    escribir(/DNI de quien recoge/, '87654321')
    escribir(/Nombres completos/, 'Pedro Ramírez')
    escribir(/Código de retiro/, 'a7k2q9')
    fireEvent.click(screen.getByLabelText(/carta poder/))
    marcarVerificacion()
    fireEvent.click(botonConfirmar())

    await waitFor(() =>
      expect(confirmarEntrega).toHaveBeenCalledWith('PED-2026-08910', {
        dniRecoge: '87654321',
        nombreRecoge: 'Pedro Ramírez',
        esTerceroAutorizado: true,
        cartaPoderVerificada: true,
        codigoRetiro: 'A7K2Q9',
      }),
    )
  })

  it('muestra el error del backend si Ventas no está disponible', async () => {
    vi.mocked(confirmarEntrega).mockRejectedValue(
      new ApiError(503, { code: 'VENTAS_NO_DISPONIBLE', detail: 'Ventas no respondió a tiempo. Reintente en unos segundos' }),
    )
    const { onEntregado } = montar()

    escribir(/DNI de quien recoge/, '45678912')
    marcarVerificacion()
    fireEvent.click(botonConfirmar())

    expect(await screen.findByText('Ventas no respondió a tiempo. Reintente en unos segundos')).toBeTruthy()
    expect(onEntregado).not.toHaveBeenCalled()
  })
})
