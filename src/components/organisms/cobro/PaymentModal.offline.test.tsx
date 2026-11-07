// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import PaymentModal from './PaymentModal'
import { ContingenciaContext } from '../../../context/ContingenciaContext'
import { _resetFallbackStorage, obtenerVentasPendientes } from '../../../lib/offlineStorage'
import * as hookConexion from '../../../hooks/useEstadoConexion'

vi.mock('../../../hooks/useEstadoConexion')
const mockUseEstadoConexion = vi.mocked(hookConexion.useEstadoConexion)

const clienteMock = {
  id: 'CLI-001',
  nombre: 'Juan Pérez',
  tipoDocumento: 'DNI' as const,
  numeroDocumento: '12345678',
}

const itemsMock = [
  {
    sku: 'POLO-BLANCO-M',
    nombre: 'Polo Deportivo',
    talla: 'M',
    color: 'Blanco',
    cantidad: 1,
    precioUnitario: 80,
  },
]

describe('PaymentModal en modo Contingencia Offline (RF-26, RF-27)', () => {
  beforeEach(() => {
    _resetFallbackStorage()
    sessionStorage.clear()
    vi.clearAllMocks()
    mockUseEstadoConexion.mockReturnValue(false)
  })

  afterEach(() => {
    cleanup()
    _resetFallbackStorage()
    sessionStorage.clear()
  })

  it('muestra aviso de contingencia y deshabilita pago con tarjeta y facturas (RF-26 / CA-10-04)', async () => {
    render(
      <MemoryRouter>
        <ContingenciaContext.Provider
          value={{
            enLinea: false,
            pendientesCount: 0,
            sincronizando: false,
            progreso: null,
            mensajeExito: null,
            errorSync: null,
            registrarVentaOffline: vi.fn(),
            sincronizarCola: vi.fn(),
            refrescarPendientes: vi.fn(),
          }}
        >
          <PaymentModal
            total={80}
            cliente={clienteMock}
            items={itemsMock}
            vendedor="VEN-001"
            terminalPos="POS-01"
            turnoId="00000000-0000-0000-0000-000000000000"
            onClose={vi.fn()}
            onVentaConfirmada={vi.fn()}
          />
        </ContingenciaContext.Provider>
      </MemoryRouter>
    )

    // Aviso de contingencia
    expect(screen.getByText(/Modo Contingencia Activo/i)).toBeTruthy()

    // Botón tarjeta deshabilitado
    const botonTarjeta = screen.getByRole('button', { name: /tarjeta/i })
    expect(botonTarjeta).toHaveProperty('disabled', true)

    // Botón factura deshabilitado
    const botonFactura = screen.getByRole('button', { name: /factura electrónica/i })
    expect(botonFactura).toHaveProperty('disabled', true)
  })

  it('registra la venta en contingencia en IndexedDB con hash y emite ticket CONT (RF-27 / CA-10-02)', async () => {
    const onVentaConfirmada = vi.fn()
    const registrarVentaOffline = vi.fn().mockImplementation(async (v) => {
      // Registrar en fallback storage para verificar
      const { guardarVentaOffline } = await import('../../../lib/offlineStorage')
      await guardarVentaOffline(v)
    })

    render(
      <MemoryRouter>
        <ContingenciaContext.Provider
          value={{
            enLinea: false,
            pendientesCount: 0,
            sincronizando: false,
            progreso: null,
            mensajeExito: null,
            errorSync: null,
            registrarVentaOffline,
            sincronizarCola: vi.fn(),
            refrescarPendientes: vi.fn(),
          }}
        >
          <PaymentModal
            total={80}
            cliente={clienteMock}
            items={itemsMock}
            vendedor="VEN-001"
            terminalPos="POS-01"
            turnoId="00000000-0000-0000-0000-000000000000"
            onClose={vi.fn()}
            onVentaConfirmada={onVentaConfirmada}
          />
        </ContingenciaContext.Provider>
      </MemoryRouter>
    )

    // Ingresar efectivo recibido: 100 soles
    const inputEfectivo = screen.getByPlaceholderText('0.00')
    fireEvent.change(inputEfectivo, { target: { value: '100' } })

    // Presionar confirmar (en offline se titula "Emitir Ticket Contingencia")
    const botonCobrar = screen.getByRole('button', { name: /emitir ticket contingencia/i })
    await act(async () => {
      fireEvent.click(botonCobrar)
    })

    // Callback onVentaConfirmada invocado con datos de contingencia
    await waitFor(() => expect(onVentaConfirmada).toHaveBeenCalledTimes(1))
    const datosConfirmados = onVentaConfirmada.mock.calls[0][0]
    expect(datosConfirmados.esContingencia).toBe(true)
    expect(datosConfirmados.correlativoContingencia).toMatch(/^CONT-\d{5}$/)
    expect(datosConfirmados.hashIntegridad).toBeTruthy()
    expect(datosConfirmados.hashIntegridad.length).toBe(64) // SHA-256 en hex

    // Se guardó en la cola local
    const pendientes = await obtenerVentasPendientes()
    expect(pendientes.length).toBe(1)
    expect(pendientes[0].correlativoContingencia).toBe(datosConfirmados.correlativoContingencia)
    expect(pendientes[0].hashIntegridad).toBe(datosConfirmados.hashIntegridad)
  })
})


