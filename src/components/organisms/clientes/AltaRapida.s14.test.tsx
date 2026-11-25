// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import CustomerSection from './CustomerSection'
import { buscarCliente, registrarCliente } from './clientesApi'
import { ApiError } from '../../../api/http'
import { useCartStore } from '../../../store/cart'

vi.mock('./clientesApi', async (original) => ({
  ...(await original<typeof import('./clientesApi')>()),
  buscarCliente: vi.fn(), registrarCliente: vi.fn(),
}))

function Mostrador() {
  const cliente = useCartStore((estado) => estado.cliente)
  return <CustomerSection cliente={cliente} onAsociarCliente={useCartStore.getState().setCliente} />
}

beforeEach(() => {
  useCartStore.setState({ items: [], cliente: null, cupon: '', carritosEnEspera: [] })
  useCartStore.getState().agregarProducto({ id: 'polo', name: 'Polo', price: 50, stock: 5, category: 'Ropa', image: '/polo.jpg' })
  useCartStore.getState().fijarCantidad('polo', 2)
  vi.mocked(buscarCliente).mockRejectedValue(new ApiError(404, { code: 'CLIENTE_NO_ENCONTRADO' }))
})
afterEach(() => { cleanup(); vi.resetAllMocks(); useCartStore.setState({ items: [], cliente: null }) })

async function abrirAlta() {
  render(<Mostrador />)
  fireEvent.change(screen.getByLabelText('DNI del cliente'), { target: { value: '45678912' } })
  fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))
  await screen.findByRole('dialog')
}

function completar(correo = 'rosa@correo.com') {
  for (const [nombre, valor] of [[/^Nombres/, 'Rosa'], [/^Apellidos/, 'Huaman'], [/Correo electrónico/, correo], [/Teléfono celular/, '987654321']] as const) {
    fireEvent.change(screen.getByLabelText(nombre), { target: { value: valor } })
  }
}

it('RF-08: guardar asocia al cliente, cierra el alta y conserva las prendas y cantidades', async () => {
  vi.mocked(registrarCliente).mockResolvedValue({ clienteId: 'cli-1', tipoDocumento: 'DNI', numeroDocumento: '45678912', nombreCompleto: 'Rosa Huaman' })
  const prendas = structuredClone(useCartStore.getState().items)
  await abrirAlta()
  completar()
  fireEvent.click(screen.getByRole('button', { name: 'Guardar y asociar a la venta' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(registrarCliente).toHaveBeenCalledWith({ canalOrigen: 'RETAIL', tipoDocumento: 'DNI', numeroDocumento: '45678912', nombres: 'Rosa', apellidos: 'Huaman', email: 'rosa@correo.com', telefono: '987654321' })
  expect(useCartStore.getState().cliente?.id).toBe('cli-1')
  expect(useCartStore.getState().items).toEqual(prendas)
  expect(screen.getByText('Rosa Huaman')).toBeTruthy()
})

it('RF-08: cancelar el alta conserva la orden y permite continuar sin cliente', async () => {
  const prendas = structuredClone(useCartStore.getState().items)
  await abrirAlta()
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(registrarCliente).not.toHaveBeenCalled()
  expect(useCartStore.getState().items).toEqual(prendas)
  expect(useCartStore.getState().cliente).toBeNull()
  expect(screen.getByRole('button', { name: 'Buscar' })).toHaveProperty('disabled', false)
})

it('RF-09: correo con puntos consecutivos bloquea guardar aunque los demás datos sean válidos', async () => {
  await abrirAlta()
  completar('rosa@correo..com')
  fireEvent.blur(screen.getByLabelText(/Correo electrónico/))
  expect(screen.getByRole('button', { name: 'Guardar y asociar a la venta' })).toHaveProperty('disabled', true)
  expect(screen.getByText(/Ingresa un correo electrónico válido/)).toBeTruthy()
  expect(registrarCliente).not.toHaveBeenCalled()
})

