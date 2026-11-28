// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { listarCuarentena } from '../api/inventarioApi'
import { products } from '../data/products'
import { MENSAJE_BLOQUEO } from '../lib/cuarentena'
import PosPage from './PosPage'

vi.mock('../api/inventarioApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/inventarioApi')>()),
  listarCuarentena: vi.fn(),
}))
vi.mock('../api/caja', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/caja')>()),
  turnoActual: vi.fn().mockResolvedValue({ estado: 'ABIERTA', turnoId: 'turno-1', terminalPos: 'POS-01' }),
}))
vi.mock('../hooks/useCampanasVigentes', () => ({ useCampanasVigentes: () => [] }))
vi.mock('../components/organisms/control/ControlTowerMenu', () => ({ default: () => null }))

// Zapatillas Velocity X: talla 38 negro en cuarentena; talla 39 negro libre.
const ETIQUETA_BLOQUEADA = '7751001000012'
const ETIQUETA_LIBRE = '7751001000029'

const addToCart = vi.fn()

beforeEach(() => {
  vi.mocked(listarCuarentena).mockResolvedValue([
    {
      incidenciaId: 'inc-1',
      sku: 'ZAPVEL-38-NEG',
      nombreProducto: 'Zapatillas Velocity X (38 / Negro)',
      tipoFalla: 'COSTURA_ROTA',
      fechaReporte: '2026-11-26T15:30:00Z',
      estado: 'EN_CUARENTENA',
    },
  ])
})

afterEach(() => {
  cleanup()
  addToCart.mockReset()
  vi.mocked(listarCuarentena).mockReset()
})

const renderizar = () =>
  render(
    <MemoryRouter>
      <PosPage
        products={products}
        catalog={products}
        cart={[]}
        addToCart={addToCart}
        increaseQuantity={() => {}}
        decreaseQuantity={() => {}}
        removeFromCart={() => {}}
        subtotal={0}
        search=""
        onSearchChange={() => {}}
        category="Todas"
        categories={[]}
        onCategoryChange={() => {}}
      />
    </MemoryRouter>,
  )

const escanear = async (codigo: string) => {
  const lector = screen.getByLabelText('Código de barras o SKU a escanear')
  fireEvent.change(lector, { target: { value: codigo } })
  await act(async () => {
    fireEvent.submit(lector.closest('form')!)
  })
}

describe('PosPage con cuarentena (F12 · RF-33)', () => {
  it('CA-RF33-02: escanear una prenda en cuarentena no la agrega y muestra la alerta', async () => {
    renderizar()
    await waitFor(() => expect(listarCuarentena).toHaveBeenCalled())

    await escanear(ETIQUETA_BLOQUEADA)

    expect(await screen.findByText(MENSAJE_BLOQUEO)).toBeTruthy()
    expect(addToCart).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }))
    expect(screen.queryByText(MENSAJE_BLOQUEO)).toBeNull()
  })

  it('una talla libre del mismo modelo se sigue vendiendo', async () => {
    renderizar()
    await waitFor(() => expect(listarCuarentena).toHaveBeenCalled())

    await escanear(ETIQUETA_LIBRE)

    expect(addToCart).toHaveBeenCalledWith(expect.objectContaining({ id: 'ZAPVEL-39-NEG' }))
    expect(screen.queryByText(MENSAJE_BLOQUEO)).toBeNull()
  })

  it('una etiqueta desconocida no hace nada', async () => {
    renderizar()
    await waitFor(() => expect(listarCuarentena).toHaveBeenCalled())

    await escanear('0000000000000')

    expect(addToCart).not.toHaveBeenCalled()
  })

  it('RF-32: "Reportar incidencia" abre el reporte desde el POS', async () => {
    renderizar()
    await waitFor(() => expect(listarCuarentena).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: 'Reportar incidencia' }))

    expect(screen.getByRole('dialog', { name: 'Reportar incidencia' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog', { name: 'Reportar incidencia' })).toBeNull()
  })

  it('ofrece el acceso a la bandeja de cuarentena', () => {
    renderizar()
    expect(screen.getByRole('link', { name: 'Cuarentena' }).getAttribute('href')).toBe('/cuarentena')
  })
})
