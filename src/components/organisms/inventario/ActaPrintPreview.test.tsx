// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import ActaPrintPreview from './ActaPrintPreview'
import type { ActaEmitida } from '../../../api/actasMermaApi'

const ACTA: ActaEmitida = {
  actaNumero: 'ACTA-MERMA-2026-0012',
  fechaEmision: '2026-11-28T18:00:00Z',
  tiendaId: 'TIENDA-MIRAFLORES',
  tipoDestino: 'DEVOLUCION_CENTRAL',
  observaciones: 'Lote enviado con transporte interno',
  supervisor: { id: 'bbbbbbbb-0000-0000-0000-000000000002', nombre: 'Rosa Quispe' },
  totalPrendas: 2,
  incidencias: [
    {
      incidenciaId: 'inc-1',
      sku: 'POLTEC-M-BLA',
      tipoFalla: 'MANCHADO_PROBADOR',
      detalleObservacion: 'Mancha de maquillaje en el cuello',
      estado: 'DERIVADO_ALMACEN',
    },
    {
      incidenciaId: 'inc-2',
      sku: 'ZAPVEL-38-NEG',
      tipoFalla: 'COSTURA_ROTA',
      detalleObservacion: 'Costura abierta en el talón',
      estado: 'DERIVADO_ALMACEN',
    },
  ],
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const abrir = () => render(<ActaPrintPreview acta={ACTA} nombres={{ 'inc-1': 'Polo técnico DryFit M blanco' }} />)

describe('ActaPrintPreview (RF-34)', () => {
  it('CA-RF34-03: la cabecera lleva el número correlativo, la fecha, la tienda, el supervisor y el destino', () => {
    abrir()

    const acta = screen.getByRole('article', { name: 'Acta ACTA-MERMA-2026-0012' })
    expect(within(acta).getByText('ACTA-MERMA-2026-0012')).toBeTruthy()
    expect(within(acta).getByText(/^Emitida /)).toBeTruthy()
    expect(within(acta).getByText('TIENDA-MIRAFLORES')).toBeTruthy()
    expect(within(acta).getByText('Rosa Quispe', { selector: 'dd' })).toBeTruthy()
    expect(within(acta).getByText('Devolución a almacén central por garantía')).toBeTruthy()
  })

  it('desglosa cada prenda con SKU, nombre, motivo, detalle y estado, y el total', () => {
    abrir()

    const filas = screen.getAllByRole('row').slice(1)
    expect(filas).toHaveLength(2)
    expect(within(filas[0]).getByText('POLTEC-M-BLA')).toBeTruthy()
    expect(within(filas[0]).getByText('Polo técnico DryFit M blanco')).toBeTruthy()
    expect(within(filas[0]).getByText('Prenda manchada en probador')).toBeTruthy()
    expect(within(filas[0]).getByText('Mancha de maquillaje en el cuello')).toBeTruthy()
    expect(within(filas[1]).getByText('DERIVADO_ALMACEN')).toBeTruthy()
    expect(screen.getByText('Total de prendas: 2')).toBeTruthy()
    expect(screen.getByText('Lote enviado con transporte interno')).toBeTruthy()
  })

  it('incluye las casillas de firma del supervisor y de quien recibe', () => {
    abrir()

    expect(screen.getByText(/Firma del supervisor de tienda/)).toBeTruthy()
    expect(screen.getByText(/Firma de quien recibe en almacén central/)).toBeTruthy()
  })

  it('el botón imprime el acta', () => {
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => {})
    abrir()

    fireEvent.click(screen.getByRole('button', { name: /Imprimir acta/ }))

    expect(imprimir).toHaveBeenCalledOnce()
  })
})
