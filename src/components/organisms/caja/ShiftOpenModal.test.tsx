// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import ShiftOpenModal from './ShiftOpenModal'
import { abrirTurno, turnoActual, TERMINAL_POS } from '../../../api/caja'
import { ApiError } from '../../../api/http'
import { useAuthStore } from '../../../store/authStore'
import { useCajaStore } from '../../../store/caja'

vi.mock('../../../api/caja', async (original) => ({
  ...(await original<typeof import('../../../api/caja')>()), abrirTurno: vi.fn(), turnoActual: vi.fn(),
}))

beforeEach(() => {
  useAuthStore.setState({ perfil: { usuarioId: 'vendedor', codigoVendedor: 'VEN-01', tiendaId: 'TIENDA-01', perfilTienda: 'VENDEDOR', activo: true } })
  useCajaStore.getState().reiniciar()
})
afterEach(() => { cleanup(); vi.resetAllMocks(); useCajaStore.getState().reiniciar(); useAuthStore.setState({ perfil: null }) })

it('RF-20: un fondo negativo impide abrir turno', () => {
  render(<ShiftOpenModal />)
  fireEvent.change(screen.getByLabelText(/Fondo fijo inicial/), { target: { value: '-1' } })
  expect(screen.getByRole('button', { name: 'Confirmar apertura' })).toHaveProperty('disabled', true)
  expect(screen.getByText('El monto no puede ser negativo')).toBeTruthy()
  expect(abrirTurno).not.toHaveBeenCalled()
})

it('RF-20: abrir con S/150 actualiza el turno disponible para el POS', async () => {
  const turno = { estado: 'ABIERTA' as const, turnoId: 'turno-1', saldoInicialEfectivo: 150 }
  vi.mocked(abrirTurno).mockResolvedValue(turno)
  vi.mocked(turnoActual).mockResolvedValue(turno)
  render(<ShiftOpenModal />)
  fireEvent.change(screen.getByLabelText(/Fondo fijo inicial/), { target: { value: '150' } })
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar apertura' }))
  await waitFor(() => expect(useCajaStore.getState().caja).toEqual(turno))
  expect(abrirTurno).toHaveBeenCalledWith(150, TERMINAL_POS)
})

it('RF-20: un conflicto 409 informa que la terminal ya tiene un turno y no habilita otra apertura', async () => {
  vi.mocked(abrirTurno).mockRejectedValue(new ApiError(409, { code: 'TURNO_YA_ABIERTO' }))
  render(<ShiftOpenModal />)
  fireEvent.change(screen.getByLabelText(/Fondo fijo inicial/), { target: { value: '150' } })
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar apertura' }))
  expect(await screen.findByText(/La terminal ya cuenta con un turno abierto/)).toBeTruthy()
  expect(useCajaStore.getState().caja).toBeNull()
  expect(turnoActual).not.toHaveBeenCalled()
})
