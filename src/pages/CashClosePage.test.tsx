// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import CashClosePage from './CashClosePage'
import { cerrarTurno, registrarMovimiento } from '../api/caja'
import { useCajaStore } from '../store/caja'

vi.mock('../api/caja', async (original) => ({
  ...(await original<typeof import('../api/caja')>()), cerrarTurno: vi.fn(), registrarMovimiento: vi.fn(),
}))
beforeEach(() => useCajaStore.setState({ caja: { estado: 'ABIERTA', turnoId: 'turno-1', saldoInicialEfectivo: 150 }, ultimoReporteZ: null }))
afterEach(() => { cleanup(); vi.resetAllMocks(); useCajaStore.getState().reiniciar() })
const montar = () => render(<MemoryRouter><CashClosePage /></MemoryRouter>)

it('RF-22: muestra solo el conteo declarado antes del cierre y revela el reporte al confirmarlo', async () => {
  const reporte = { turnoId: 'turno-1', saldoInicial: 150, ventasEfectivoTotal: 50, ingresosMenores: 0, egresosMenores: 0, saldoSistema: 200, saldoDeclarado: 150, diferencia: -50, estado: 'OBSERVADA' as const }
  vi.mocked(cerrarTurno).mockResolvedValue(reporte)
  montar()
  expect(screen.queryByText(/Saldo del sistema/i)).toBeNull()
  fireEvent.change(screen.getByLabelText('S/ 50.00'), { target: { value: '3' } })
  expect(screen.getByRole('status').textContent).toContain('S/ 150.00')
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar y cerrar caja' }))
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar y cerrar caja' }))
  await screen.findByText('Turno cerrado')
  expect(cerrarTurno).toHaveBeenCalledWith('turno-1', 150, '')
  expect(useCajaStore.getState().caja?.estado).toBe('CERRADA')
  expect(useCajaStore.getState().ultimoReporteZ).toEqual(reporte)
  expect(screen.getByRole('button', { name: 'Imprimir Reporte Z' })).toBeTruthy()
})

it('RF-22: registrar un movimiento durante el arqueo no revela el saldo teórico antes de enviar el conteo', async () => {
  vi.mocked(registrarMovimiento).mockResolvedValue({ movimientoId: 'mov-1', nuevoSaldoEstimado: 185 })
  montar()
  fireEvent.click(screen.getByRole('button', { name: 'Registrar movimiento' }))
  const dialogo = within(screen.getByRole('dialog'))
  fireEvent.change(dialogo.getByLabelText('Monto'), { target: { value: '15' } })
  fireEvent.change(dialogo.getByLabelText('Motivo'), { target: { value: 'Papel térmico' } })
  fireEvent.change(dialogo.getByLabelText('Autorizado por'), { target: { value: 'Supervisor' } })
  fireEvent.click(dialogo.getByRole('button', { name: 'Registrar movimiento' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(registrarMovimiento).toHaveBeenCalledWith('turno-1', { tipoMovimiento: 'SALIDA_GASTO', monto: 15, motivo: 'Papel térmico', autorizadoPor: 'Supervisor' })
  expect(cerrarTurno).not.toHaveBeenCalled()
  expect(screen.queryByText(/185\.00/)).toBeNull()
  expect(screen.queryByText(/Efectivo estimado en gaveta/)).toBeNull()
})
