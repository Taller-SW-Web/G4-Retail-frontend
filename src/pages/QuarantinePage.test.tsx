// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { listarCuarentena } from '../api/inventarioApi'
import { products } from '../data/products'
import QuarantinePage from './QuarantinePage'

vi.mock('../api/inventarioApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/inventarioApi')>()),
  listarCuarentena: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.mocked(listarCuarentena).mockReset()
})

const renderizar = () =>
  render(
    <MemoryRouter>
      <QuarantinePage products={products} />
    </MemoryRouter>,
  )

describe('QuarantinePage (F12 · RF-32, RF-33)', () => {
  it('muestra la bandeja de la tienda', async () => {
    vi.mocked(listarCuarentena).mockResolvedValue([
      {
        incidenciaId: 'abcd1234-0000',
        sku: 'ZAPVEL-38-NEG',
        nombreProducto: 'Zapatillas Velocity X (38 / Negro)',
        tipoFalla: 'COSTURA_ROTA',
        fechaReporte: '2026-11-26T15:30:00Z',
        estado: 'EN_CUARENTENA',
      },
    ])

    renderizar()

    expect(await screen.findByText('Zapatillas Velocity X (38 / Negro)')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Artículos en cuarentena' })).toBeTruthy()
  })

  it('abre el reporte de incidencia y lo cierra', async () => {
    vi.mocked(listarCuarentena).mockResolvedValue([])
    renderizar()
    await screen.findByText('No hay prendas en cuarentena')

    fireEvent.click(screen.getByRole('button', { name: 'Reportar incidencia' }))
    expect(screen.getByRole('dialog', { name: 'Reportar incidencia' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('Actualizar vuelve a consultar la bandeja', async () => {
    vi.mocked(listarCuarentena).mockResolvedValue([])
    renderizar()
    await screen.findByText('No hay prendas en cuarentena')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }))
    })

    expect(listarCuarentena).toHaveBeenCalledTimes(2)
  })
})
