// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ExchangePage from './ExchangePage'
import { registrarCambio, validarBoleta, type ValidacionCambio } from '../api/cambiosApi'

vi.mock('../api/cambiosApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/cambiosApi')>()),
  validarBoleta: vi.fn(),
  registrarCambio: vi.fn(),
}))

const EN_PLAZO: ValidacionCambio = {
  boletaNumero: 'B001-00000045',
  pedidoId: 'PED-2026-00412',
  fechaEmision: '2026-11-05T15:00:00Z',
  diasTranscurridos: 2,
  plazoDias: 7,
  plazoValido: true,
  items: [
    {
      sku: 'POLTEC-M-BLA',
      descripcion: 'Polo tecnico DryFit, talla M, blanco',
      precioPagado: 59.9,
      cantidadComprada: 2,
      cantidadDisponibleCambio: 2,
    },
  ],
}

afterEach(() => {
  cleanup()
  vi.mocked(validarBoleta).mockReset()
  vi.mocked(registrarCambio).mockReset()
})

function abrir() {
  render(
    <MemoryRouter>
      <ExchangePage />
    </MemoryRouter>,
  )
}

function consultar(boleta: string) {
  fireEvent.change(screen.getByLabelText('Número de boleta'), { target: { value: boleta } })
  fireEvent.click(screen.getByRole('button', { name: 'Validar boleta' }))
}

describe('ExchangePage (F9)', () => {
  it('RF-23: una boleta en plazo muestra la etiqueta verde con el día del plazo', async () => {
    vi.mocked(validarBoleta).mockResolvedValue(EN_PLAZO)
    abrir()

    consultar('b001-00000045')

    expect(await screen.findByText('Válido para cambio (día 2 de 7)')).toBeTruthy()
    expect(validarBoleta).toHaveBeenCalledWith('b001-00000045')
    expect(screen.getByRole('button', { name: /Cambiar/ }).hasAttribute('disabled')).toBe(false)
  })

  it('RF-23: una boleta vencida bloquea la selección de prendas', async () => {
    vi.mocked(validarBoleta).mockResolvedValue({ ...EN_PLAZO, diasTranscurridos: 20, plazoValido: false })
    abrir()

    consultar('B001-00000045')

    expect(await screen.findByText('Plazo expirado (20 días)')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Cambiar/ }).hasAttribute('disabled')).toBe(true)
  })

  it('no consulta al servidor si el número no tiene el formato de boleta', () => {
    abrir()

    consultar('B001-45')

    expect(screen.getByText('El comprobante debe tener el formato B001-00000045.')).toBeTruthy()
    expect(validarBoleta).not.toHaveBeenCalled()
  })

  it('RF-24: el cambio de talla queda bloqueado hasta completar el checklist crítico', async () => {
    vi.mocked(validarBoleta).mockResolvedValue(EN_PLAZO)
    abrir()
    consultar('B001-00000045')
    fireEvent.click(await screen.findByRole('button', { name: /Cambiar/ }))

    const aprobar = screen.getByRole('button', { name: /Aprobar cambio/ })
    expect(aprobar.hasAttribute('disabled')).toBe(true)

    fireEvent.click(screen.getByLabelText('Etiquetas colgantes originales intactas'))
    fireEvent.click(screen.getByLabelText('Prenda limpia y sin signos de uso'))

    expect(screen.getByRole('button', { name: /Aprobar cambio/ }).hasAttribute('disabled')).toBe(false)
  })

  it('RF-24: una falla de fábrica se deriva a Postventa y no permite emitir vale', async () => {
    vi.mocked(validarBoleta).mockResolvedValue(EN_PLAZO)
    abrir()
    consultar('B001-00000045')
    fireEvent.click(await screen.findByRole('button', { name: /Cambiar/ }))

    fireEvent.click(screen.getByLabelText('Falla de fábrica'))

    expect(screen.getByText(/Deriva la prenda a Postventa/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Aprobar cambio/ }).hasAttribute('disabled')).toBe(true)
    expect(registrarCambio).not.toHaveBeenCalled()
  })

  it('RF-25: al aprobar emite el vale térmico y descuenta la unidad cambiada', async () => {
    vi.mocked(validarBoleta).mockResolvedValue(EN_PLAZO)
    vi.mocked(registrarCambio).mockResolvedValue({
      solicitudId: '7c1d',
      estadoAprobacion: 'APROBADO_EN_TIENDA',
      destinoSugerido: 'REINGRESO_INVENTARIO',
      montoAcreditado: 59.9,
      observaciones: [],
      vale: {
        codigoVale: 'VALE-2026-00001',
        monto: 59.9,
        codigoBarras: 'VALE-2026-00001',
        boletaOrigen: 'B001-00000045',
        fechaEmision: '2026-11-07T15:00:00Z',
        fechaVencimiento: '2026-12-07T15:00:00Z',
        estado: 'EMITIDO',
      },
    })
    abrir()
    consultar('B001-00000045')
    fireEvent.click(await screen.findByRole('button', { name: /Cambiar/ }))
    fireEvent.click(screen.getByLabelText('Etiquetas colgantes originales intactas'))
    fireEvent.click(screen.getByLabelText('Prenda limpia y sin signos de uso'))

    fireEvent.click(screen.getByRole('button', { name: /Aprobar cambio/ }))

    expect(await screen.findByLabelText('Vale de compra VALE-2026-00001')).toBeTruthy()
    const [cambio, clave] = vi.mocked(registrarCambio).mock.calls[0]
    expect(cambio).toMatchObject({ boletaNumero: 'B001-00000045', sku: 'POLTEC-M-BLA', cantidad: 1, motivo: 'CAMBIO_TALLA' })
    expect(clave).toMatch(/^[0-9a-f-]{36}$/)

    fireEvent.click(screen.getByText('Cerrar', { selector: 'button' }))
    await waitFor(() => expect(screen.getByText(/1 de 2 disponibles para cambio/)).toBeTruthy())
  })
})
