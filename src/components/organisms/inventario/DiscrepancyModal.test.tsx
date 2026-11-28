// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../api/http'
import { products } from '../../../data/products'
import DiscrepancyModal from './DiscrepancyModal'

const reportarIncidencia = vi.hoisted(() => vi.fn())

vi.mock('../../../api/inventarioApi', async (original) => ({
  ...(await original<typeof import('../../../api/inventarioApi')>()),
  reportarIncidencia,
}))

// Zapatillas Velocity X, talla 38 negro, en el catálogo semilla.
const CODIGO = '7751001000012'
const SKU = 'ZAPVEL-38-NEG'

beforeEach(() => {
  reportarIncidencia.mockReset()
  reportarIncidencia.mockResolvedValue({ incidenciaId: 'a1b2c3d4-0000', estado: 'PENDIENTE_REPORTE', sku: SKU })
})

afterEach(() => cleanup())

const escanear = async (codigo = CODIGO) => {
  fireEvent.change(screen.getByLabelText('Código de barras o SKU'), { target: { value: codigo } })
  await act(async () => {
    fireEvent.keyDown(screen.getByLabelText('Código de barras o SKU'), { key: 'Enter' })
  })
}

const elegirFalla = (etiqueta: string) => fireEvent.click(screen.getByLabelText(etiqueta))
const escribirObservacion = (texto: string) =>
  fireEvent.change(screen.getByLabelText('Observaciones'), { target: { value: texto } })
const confirmar = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Reportar y poner en cuarentena' }))
  })
}

describe('DiscrepancyModal (F12 · RF-32)', () => {
  it('CA-RF32-01: al escanear la etiqueta carga el nombre, el SKU y la talla/color de la prenda', async () => {
    render(<DiscrepancyModal products={products} onClose={() => {}} />)

    await escanear()

    const prenda = screen.getByLabelText('Prenda identificada')
    expect(prenda.textContent).toContain('Zapatillas Velocity X')
    expect(prenda.textContent).toContain(SKU)
    expect(prenda.textContent).toContain('Talla 38')
    expect(prenda.textContent).toContain('Negro')
  })

  it('avisa si la etiqueta no corresponde a ninguna prenda del catálogo', async () => {
    render(<DiscrepancyModal products={products} onClose={() => {}} />)

    await escanear('0000000000000')

    expect(screen.getByText('No encontramos esa etiqueta en el catálogo de la tienda')).toBeTruthy()
  })

  it('pide la etiqueta si se busca con el campo vacío', async () => {
    render(<DiscrepancyModal products={products} onClose={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(screen.getByText('Escanea la etiqueta o escribe el SKU de la prenda')).toBeTruthy()
  })

  it('con el código del modelo (no de la talla) pide la etiqueta exacta', async () => {
    render(<DiscrepancyModal products={products} onClose={() => {}} />)

    await escanear('sku-1001')

    expect(screen.getByText('Escanea la etiqueta de la talla y color exactos de la prenda')).toBeTruthy()
    expect(screen.queryByLabelText('Prenda identificada')).toBeNull()
  })

  it('un artículo sin tallas se identifica por su código y se reporta con la foto', async () => {
    render(<DiscrepancyModal products={products} onClose={() => {}} />)
    await escanear('sku-1003')
    expect(screen.getByLabelText('Prenda identificada').textContent).toContain('Mancuernas 12kg')
    elegirFalla('Artículo extraviado / no ubicado')
    escribirObservacion('No está en el anaquel')
    fireEvent.change(screen.getByLabelText(/URL de la foto/), { target: { value: ' https://foto/1.jpg ' } })

    await confirmar()

    expect(reportarIncidencia.mock.calls[0][0]).toEqual({
      sku: 'sku-1003',
      tipoFalla: 'EXTRAVIO_NO_UBICADO',
      detalleObservacion: 'No está en el anaquel',
      evidenciaFotoUrl: 'https://foto/1.jpg',
    })
  })

  it('un error inesperado muestra un mensaje genérico', async () => {
    reportarIncidencia.mockRejectedValueOnce(new Error('boom'))
    render(<DiscrepancyModal products={products} onClose={() => {}} />)
    await escanear()
    elegirFalla('Costura o tela dañada')
    escribirObservacion('Costura abierta')

    await confirmar()

    expect(screen.getByText('No se pudo registrar la incidencia. Intenta nuevamente.')).toBeTruthy()
  })

  it('CA-RF32-04: enviar sin tipo de falla muestra la validación y no reporta', async () => {
    render(<DiscrepancyModal products={products} onClose={() => {}} />)
    await escanear()
    escribirObservacion('Mancha de maquillaje en el cuello')

    await confirmar()

    expect(screen.getByText('Selecciona el tipo de falla')).toBeTruthy()
    expect(reportarIncidencia).not.toHaveBeenCalled()
  })

  it('exige una observación de al menos 5 caracteres', async () => {
    render(<DiscrepancyModal products={products} onClose={() => {}} />)
    await escanear()
    elegirFalla('Costura o tela dañada')
    escribirObservacion('  mal ')

    await confirmar()

    expect(screen.getByText('Describe la falla con al menos 5 caracteres')).toBeTruthy()
    expect(reportarIncidencia).not.toHaveBeenCalled()
  })

  it('CA-RF32-02: con motivo "Costura dañada" registra la incidencia y confirma la cuarentena', async () => {
    const onReportada = vi.fn()
    render(<DiscrepancyModal products={products} onClose={() => {}} onReportada={onReportada} />)
    await escanear()
    elegirFalla('Costura o tela dañada')
    escribirObservacion('  Costura abierta en el talón  ')

    await confirmar()

    expect(reportarIncidencia).toHaveBeenCalledTimes(1)
    const [datos, clave] = reportarIncidencia.mock.calls[0]
    expect(datos).toEqual({
      sku: SKU,
      codigoBarras: CODIGO,
      tipoFalla: 'COSTURA_ROTA',
      detalleObservacion: 'Costura abierta en el talón',
    })
    expect(clave).toMatch(/^[0-9a-f-]{36}$/)
    expect(screen.getByText('La prenda quedó en cuarentena')).toBeTruthy()
    expect(onReportada).toHaveBeenCalledWith(expect.objectContaining({ sku: SKU, estado: 'PENDIENTE_REPORTE' }))
  })

  it('🔁 reintentar el mismo reporte tras un fallo de red reutiliza la Idempotency-Key', async () => {
    reportarIncidencia.mockRejectedValueOnce(new ApiError(0, { code: 'SIN_CONEXION', detail: 'Sin conexión' }))
    render(<DiscrepancyModal products={products} onClose={() => {}} />)
    await escanear()
    elegirFalla('Prenda manchada en probador')
    escribirObservacion('Mancha de maquillaje')

    await confirmar()
    expect(screen.getByText('Sin conexión')).toBeTruthy()
    await confirmar()

    expect(reportarIncidencia).toHaveBeenCalledTimes(2)
    expect(reportarIncidencia.mock.calls[1][1]).toBe(reportarIncidencia.mock.calls[0][1])
  })

  it('sin turno de caja abierto explica qué hacer', async () => {
    reportarIncidencia.mockRejectedValueOnce(new ApiError(409, { code: 'TURNO_NO_ABIERTO' }))
    render(<DiscrepancyModal products={products} onClose={() => {}} />)
    await escanear()
    elegirFalla('Falla de confección')
    escribirObservacion('Suela despegada')

    await confirmar()

    expect(screen.getByText('Abre el turno de caja antes de reportar una incidencia.')).toBeTruthy()
  })
})
