// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ExchangePage from './ExchangePage'
import { registrarCambio, validarBoleta, type CambioRegistrado, type ValidacionCambio } from '../api/cambiosApi'
import { useCajaStore } from '../store/caja'
import type { Product } from '../types'

vi.mock('../api/cambiosApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/cambiosApi')>()),
  validarBoleta: vi.fn(),
  registrarCambio: vi.fn(),
}))

const CATALOGO: Product[] = [
  {
    id: 'PROD-104',
    name: 'Polo técnico DryFit',
    category: 'Polos',
    price: 59.9,
    stock: 10,
    image: '',
    variants: [
      { sku: 'POLTEC-M-BLA', barcode: '7750000000104', size: 'M', color: 'Blanco', stock: 5, price: 59.9 },
      { sku: 'POLTEC-L-AZU', barcode: '7750000000105', size: 'L', color: 'Azul', stock: 5, price: 59.9 },
      { sku: 'POLTEC-S-BLA', barcode: '7750000000106', size: 'S', color: 'Blanco', stock: 5, price: 59.9 },
    ],
  },
  {
    id: 'PROD-103',
    name: 'Top deportivo',
    category: 'Tops',
    price: 89,
    stock: 10,
    image: '',
    variants: [{ sku: 'TOPDE-M-NEG', barcode: '7750000000103', size: 'M', color: 'Negro', stock: 5, price: 89 }],
  },
]

vi.mock('../api/catalogoApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/catalogoApi')>()),
  listarCatalogo: vi.fn(() => Promise.resolve(CATALOGO)),
}))

vi.mock('../hooks/useEstadoConexion', () => ({ useEstadoConexion: () => true }))

const EN_PLAZO: ValidacionCambio = {
  boletaNumero: 'B001-00000045',
  pedidoId: 'PED-2026-00412',
  fechaEmision: '2026-11-24T15:00:00Z',
  diasTranscurridos: 2,
  plazoDias: 7,
  plazoValido: true,
  items: [
    { sku: 'ZAPVEL-38-NEG', descripcion: 'Zapatilla Velocity 38', precioPagado: 249, cantidadComprada: 1, cantidadDisponibleCambio: 1 },
    { sku: 'POLTEC-M-BLA', descripcion: 'Polo técnico DryFit M blanco', precioPagado: 59.9, cantidadComprada: 2, cantidadDisponibleCambio: 2 },
  ],
}

const REGISTRADO: CambioRegistrado = {
  cambioId: '7c1d',
  numeroConstancia: 'CAMB-2026-000001',
  tipoCambio: 'MISMO_VALOR',
  boletaOrigen: 'B001-00000045',
  montoCredito: 59.9,
  totalNuevo: 59.9,
  diferencia: 0,
  pago: null,
  comprobante: null,
  pedidoId: 'PED-2026-00901',
  estadoInventario: 'CONFIRMADO',
  fechaCambio: '2026-11-26T20:00:00Z',
  devuelto: { sku: 'POLTEC-M-BLA', cantidad: 1, precioUnitario: 59.9 },
  nuevos: [{ sku: 'POLTEC-L-AZU', cantidad: 1, precioUnitario: 59.9 }],
}

beforeEach(() => {
  useCajaStore.setState({ caja: { estado: 'ABIERTA', turnoId: 'turno-1', terminalPos: 'POS-01' } })
})

afterEach(() => {
  cleanup()
  vi.mocked(validarBoleta).mockReset()
  vi.mocked(registrarCambio).mockReset()
  useCajaStore.setState({ caja: null })
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

/** Abre el cambio de la fila `indice` y aprueba la inspección de un cambio de talla. */
async function inspeccionarFila(indice: number) {
  vi.mocked(validarBoleta).mockResolvedValue(EN_PLAZO)
  abrir()
  consultar('B001-00000045')
  const botones = await screen.findAllByRole('button', { name: /Cambiar/ })
  fireEvent.click(botones[indice])
  fireEvent.click(screen.getByLabelText('Etiquetas colgantes originales intactas'))
  fireEvent.click(screen.getByLabelText('Prenda limpia y sin signos de uso'))
}

async function agregarPrenda(codigo: string) {
  fireEvent.change(screen.getByLabelText('Prenda nueva'), { target: { value: codigo } })
  fireEvent.click(screen.getByRole('button', { name: /Agregar/ }))
  await screen.findByLabelText('Resumen del cambio')
}

describe('Cambio directo de prenda (F9)', () => {
  it('RF-23: una boleta en plazo muestra la etiqueta verde con el día del plazo', async () => {
    vi.mocked(validarBoleta).mockResolvedValue(EN_PLAZO)
    abrir()

    consultar('b001-00000045')

    expect(await screen.findByText('Válido para cambio (día 2 de 7)')).toBeTruthy()
    expect(validarBoleta).toHaveBeenCalledWith('b001-00000045')
  })

  it('RF-23: una boleta vencida bloquea la selección de prendas', async () => {
    vi.mocked(validarBoleta).mockResolvedValue({ ...EN_PLAZO, diasTranscurridos: 20, plazoValido: false })
    abrir()

    consultar('B001-00000045')

    expect(await screen.findByText('Plazo expirado (20 días)')).toBeTruthy()
    screen.getAllByRole('button', { name: /Cambiar/ }).forEach((b) => expect(b.hasAttribute('disabled')).toBe(true))
  })

  it('sin turno de caja abierto avisa y no deja empezar el cambio', async () => {
    useCajaStore.setState({ caja: { estado: 'CERRADA' } })
    vi.mocked(validarBoleta).mockResolvedValue(EN_PLAZO)
    abrir()

    consultar('B001-00000045')

    expect(await screen.findByText('Abre el turno de caja antes de registrar un cambio.')).toBeTruthy()
    screen.getAllByRole('button', { name: /Cambiar/ }).forEach((b) => expect(b.hasAttribute('disabled')).toBe(true))
  })

  it('RF-24: sin el checklist crítico no se eligen prendas nuevas', async () => {
    vi.mocked(validarBoleta).mockResolvedValue(EN_PLAZO)
    abrir()
    consultar('B001-00000045')
    fireEvent.click((await screen.findAllByRole('button', { name: /Cambiar/ }))[1])

    expect(screen.queryByLabelText('Prenda nueva')).toBeNull()
    expect(screen.getByRole('button', { name: 'Confirmar cambio' }).hasAttribute('disabled')).toBe(true)
  })

  it('mismo modelo en otra talla: mismo valor, sin cobro, y se imprime la constancia', async () => {
    vi.mocked(registrarCambio).mockResolvedValue(REGISTRADO)
    await inspeccionarFila(1)

    await agregarPrenda('POLTEC-L-AZU')

    expect(screen.getByText('Mismo valor · sin cobro')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cambio' }))

    expect(await screen.findByLabelText('Constancia CAMB-2026-000001')).toBeTruthy()
    const [cambio, clave] = vi.mocked(registrarCambio).mock.calls[0]
    expect(cambio).toMatchObject({
      boletaNumero: 'B001-00000045',
      turnoId: 'turno-1',
      terminalPos: 'POS-01',
      devuelto: { sku: 'POLTEC-M-BLA', cantidad: 1 },
      nuevos: [{ sku: 'POLTEC-L-AZU', cantidad: 1 }],
      pagoDiferencia: null,
      comprobante: null,
    })
    expect(clave).toMatch(/^[0-9a-f-]{36}$/)

    fireEvent.click(screen.getByText('Cerrar', { selector: 'button' }))
    await waitFor(() => expect(screen.getByText(/1 de 2 disponibles para cambio/)).toBeTruthy())
  })

  it('mayor valor: muestra la diferencia y exige cobrarla antes de confirmar', async () => {
    vi.mocked(registrarCambio).mockResolvedValue({
      ...REGISTRADO,
      tipoCambio: 'MAYOR_VALOR',
      totalNuevo: 89,
      diferencia: 29.1,
      pago: { medioPago: 'EFECTIVO', montoRecibido: 30, vuelto: 0.9 },
      comprobante: { tipo: 'BOLETA', serie: 'B001', correlativo: '00000099', total: 89, fechaEmision: '2026-11-26T20:00:00Z' },
    })
    await inspeccionarFila(1)

    await agregarPrenda('TOPDE-M-NEG')

    const resumen = screen.getByLabelText('Resumen del cambio')
    expect(within(resumen).getByText('S/ 29.10')).toBeTruthy()
    const confirmar = () => screen.getByRole('button', { name: /Cobrar S\/ 29.10/ })
    expect(confirmar().hasAttribute('disabled')).toBe(true)

    fireEvent.change(screen.getByLabelText('Monto recibido'), { target: { value: '30' } })
    expect(confirmar().hasAttribute('disabled')).toBe(false)
    fireEvent.click(confirmar())

    expect(await screen.findByText('B001-00000099')).toBeTruthy()
    expect(vi.mocked(registrarCambio).mock.calls[0][0]).toMatchObject({
      pagoDiferencia: { medioPago: 'EFECTIVO', montoRecibidoEfectivo: 30 },
      comprobante: { tipo: 'BOLETA' },
    })
  })

  it('menor valor: se bloquea porque no hay vales ni devolución de dinero', async () => {
    await inspeccionarFila(0)

    await agregarPrenda('POLTEC-S-BLA')

    expect(screen.getByText('Cambio de menor valor')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Confirmar cambio' }).hasAttribute('disabled')).toBe(true)
    expect(registrarCambio).not.toHaveBeenCalled()
  })

  it('avisa si el código leído no corresponde a ninguna prenda', async () => {
    await inspeccionarFila(1)

    fireEvent.change(screen.getByLabelText('Prenda nueva'), { target: { value: 'NO-EXISTE' } })
    fireEvent.click(screen.getByRole('button', { name: /Agregar/ }))

    expect(screen.getByText('No hay una prenda con el código NO-EXISTE.')).toBeTruthy()
  })
})
