// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import CustomerSection from './CustomerSection'
import { ApiError } from '../../../api/http'
import { buscarCliente } from './clientesApi'

vi.mock('./clientesApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./clientesApi')>()),
  buscarCliente: vi.fn(),
}))

const campo = (nombre: RegExp) => screen.getByLabelText(nombre) as HTMLInputElement
const escribir = (nombre: RegExp, valor: string) => fireEvent.change(campo(nombre), { target: { value: valor } })
const elegirTipo = (tipo: string) => fireEvent.click(screen.getByRole('button', { name: tipo }))
const botonBuscar = () => screen.getByRole('button', { name: /Buscar/ }) as HTMLButtonElement
const botonAsociar = () => screen.getByRole('button', { name: /Asociar/ }) as HTMLButtonElement

function montar() {
  const onAsociarCliente = vi.fn()
  render(<CustomerSection cliente={null} onAsociarCliente={onAsociarCliente} />)
  return { onAsociarCliente }
}

afterEach(() => {
  cleanup()
  vi.mocked(buscarCliente).mockReset()
})

describe('CustomerSection — validación estricta RF-09', () => {
  it('escribir letras en el DNI no produce ningún carácter', () => {
    montar()
    escribir(/DNI del cliente/, 'abc')
    expect(campo(/DNI del cliente/).value).toBe('')

    escribir(/DNI del cliente/, '12a34b56c78')
    expect(campo(/DNI del cliente/).value).toBe('12345678')
  })

  it('DNI de 7 dígitos mantiene el botón inhabilitado y avisa cuánto falta', () => {
    montar()
    escribir(/DNI del cliente/, '1234567')

    expect(botonBuscar().disabled).toBe(true)
    expect(screen.getByText(/Faltan 1 dígito/)).toBeTruthy()
  })

  it('al salir del campo con el DNI incompleto lo marca como error', () => {
    montar()
    escribir(/DNI del cliente/, '1234567')
    fireEvent.blur(campo(/DNI del cliente/))

    expect(campo(/DNI del cliente/).getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByRole('alert')).toBeTruthy()
  })

  it('RUC que inicia con 30 muestra error inmediato de prefijo no autorizado', () => {
    montar()
    elegirTipo('RUC')
    escribir(/RUC de la empresa/, '30')

    expect(screen.getByRole('alert').textContent).toContain('Prefijo 30 no autorizado')
    expect(campo(/RUC de la empresa/).getAttribute('aria-invalid')).toBe('true')
  })

  it('RUC con prefijo 15 completo sigue bloqueando la asociación', () => {
    montar()
    elegirTipo('RUC')
    escribir(/RUC de la empresa/, '15123456789')
    escribir(/Razón social/, 'Comercial Andina SAC')

    expect(botonAsociar().disabled).toBe(true)
  })

  it('RUC válido con razón social se asocia sin consultar el padrón', () => {
    const { onAsociarCliente } = montar()
    elegirTipo('RUC')
    escribir(/RUC de la empresa/, '20100047218')
    escribir(/Razón social/, 'Comercial Andina SAC')
    fireEvent.click(botonAsociar())

    expect(buscarCliente).not.toHaveBeenCalled()
    expect(onAsociarCliente).toHaveBeenCalledWith({
      tipoDocumento: 'RUC',
      numeroDocumento: '20100047218',
      nombre: 'Comercial Andina SAC',
    })
  })

  it('el carné de extranjería admite letras, las pasa a mayúsculas y busca con su tipo', async () => {
    vi.mocked(buscarCliente).mockResolvedValue({
      clienteId: 'cli-ce',
      tipoDocumento: 'CE',
      numeroDocumento: 'AB1234567',
      nombreCompleto: 'Carla Mendoza',
    })
    const { onAsociarCliente } = montar()
    elegirTipo('CE')
    escribir(/Carné de extranjería/, 'ab-1234567')

    expect(campo(/Carné de extranjería/).value).toBe('AB1234567')
    fireEvent.click(botonBuscar())

    await waitFor(() => expect(onAsociarCliente).toHaveBeenCalled())
    expect(buscarCliente).toHaveBeenCalledWith('CE', 'AB1234567')
  })

  it('pasaporte de 5 caracteres no habilita la búsqueda', () => {
    montar()
    elegirTipo('Pasaporte')
    escribir(/Pasaporte del cliente/, 'P1234')

    expect(botonBuscar().disabled).toBe(true)
    expect(screen.getByText(/Faltan 1 carácter/)).toBeTruthy()
  })

  it('muestra el motivo cuando el backend responde 400 DATO_INVALIDO', async () => {
    vi.mocked(buscarCliente).mockRejectedValue(
      new ApiError(400, {
        code: 'DATO_INVALIDO',
        errores: [{ campo: 'numeroDocumento', motivo: 'El DNI debe tener exactamente 8 digitos numericos' }],
      }),
    )
    montar()
    escribir(/DNI del cliente/, '12345678')
    fireEvent.click(botonBuscar())

    expect(await screen.findByText('El DNI debe tener exactamente 8 digitos numericos')).toBeTruthy()
  })

  it('un DNI que no está en el padrón abre el alta rápida con el documento de solo lectura', async () => {
    vi.mocked(buscarCliente).mockRejectedValue(new ApiError(404, { code: 'CLIENTE_NO_ENCONTRADO' }))
    montar()
    escribir(/DNI del cliente/, '45678912')
    fireEvent.click(botonBuscar())

    const dialogo = await screen.findByRole('dialog')
    expect(dialogo.textContent).toContain('Registrar nuevo cliente')
    const documentoAlta = Array.from(dialogo.querySelectorAll('input')).find((input) => input.value === '45678912')
    expect(documentoAlta?.readOnly).toBe(true)
  })
})
