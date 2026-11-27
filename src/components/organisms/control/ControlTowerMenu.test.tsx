// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../api/controlApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../api/controlApi')>()),
  obtenerResumen: vi.fn(),
  listarStockCritico: vi.fn(),
  listarPickupsDelDia: vi.fn(),
  listarCampanasVigentes: vi.fn(),
}))

import { ApiError } from '../../../api/http'
import { listarCampanasVigentes, listarPickupsDelDia, listarStockCritico, obtenerResumen } from '../../../api/controlApi'
import { useCartStore } from '../../../store/cart'
import ControlTowerMenu from './ControlTowerMenu'

const resumen = {
  pickupPendientes: 3, stockCritico: 2, campanasVigentes: 1, fuentesNoDisponibles: [], actualizadoEn: '2026-11-26T15:00:00Z',
}

beforeEach(() => {
  vi.mocked(obtenerResumen).mockResolvedValue(resumen)
  vi.mocked(listarStockCritico).mockResolvedValue([])
  vi.mocked(listarPickupsDelDia).mockResolvedValue([])
  vi.mocked(listarCampanasVigentes).mockResolvedValue([
    {
      campanaId: 'CMP-2026-011', titulo: '30% en chimpunes', descripcion: null, tipoDescuento: 'PORCENTAJE', valor: 30,
      codigoCupon: 'GOAL2026', montoMinimo: 150, condiciones: null,
      vigenteDesde: '2020-01-01T00:00:00Z', vigenteHasta: '2099-12-31T00:00:00Z',
    },
  ])
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.useRealTimers()
  useCartStore.setState({ items: [], cliente: null, cupon: '', carritosEnEspera: [] })
})

const montar = async () => {
  await act(async () => {
    render(<ControlTowerMenu />)
  })
}

const abrir = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Torre de control/ }))
  })
}

describe('ControlTowerMenu (F11)', () => {
  it('el badge de la campana suma las alertas del resumen', async () => {
    await montar()

    expect(screen.getByRole('button', { name: 'Torre de control: 6 alertas' })).toBeTruthy()
    expect(screen.getByTestId('badge-alertas').textContent).toBe('6')
  })

  it('consulta el resumen cada 60 segundos', async () => {
    vi.useFakeTimers()
    await montar()
    expect(obtenerResumen).toHaveBeenCalledTimes(1)

    await act(async () => {
      vi.advanceTimersByTime(60_000)
    })

    expect(obtenerResumen).toHaveBeenCalledTimes(2)
  })

  it('avisa qué fuente no respondió sin bloquear el resto', async () => {
    vi.mocked(obtenerResumen).mockResolvedValue({ ...resumen, stockCritico: null, fuentesNoDisponibles: ['PRODUCTOS_G6'] })
    await montar()
    await abrir()

    expect(screen.getByRole('button', { name: 'Torre de control: 4 alertas' })).toBeTruthy()
    expect(screen.getByText(/Sin respuesta de Productos \(G6\)/)).toBeTruthy()
  })

  it('abre en el semáforo de stock y cambia de pestaña', async () => {
    await montar()
    await abrir()

    expect(listarStockCritico).toHaveBeenCalled()
    expect(screen.getByText('Stock en orden')).toBeTruthy()

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Pickups de hoy/ }))
    })
    expect(listarPickupsDelDia).toHaveBeenCalled()
    expect(screen.getByText('Sin paquetes por entregar')).toBeTruthy()
  })

  it('desde la pestaña de campañas aplica el cupón al carrito', async () => {
    await montar()
    await abrir()
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Campañas/ }))
    })

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cupón GOAL2026' }))

    expect(useCartStore.getState().cupon).toBe('GOAL2026')
    expect(screen.getByRole('button', { name: 'Cupón GOAL2026 aplicado' })).toBeTruthy()
  })

  it('si una sección falla ofrece reintentar', async () => {
    vi.mocked(listarStockCritico).mockRejectedValueOnce(
      new ApiError(503, { code: 'PRODUCTOS_NO_DISPONIBLE', detail: 'Productos no responde' }),
    )
    await montar()
    await abrir()

    expect(screen.getByText('Productos no responde')).toBeTruthy()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    })
    expect(screen.getByText('Stock en orden')).toBeTruthy()
  })

  it('Escape cierra el menú', async () => {
    await montar()
    await abrir()
    expect(screen.getByRole('dialog', { name: 'Torre de control del turno' })).toBeTruthy()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('dialog', { name: 'Torre de control del turno' })).toBeNull()
  })
})
