// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import ActaPrintPreview from './ActaPrintPreview'
import type { ActaEmitida, IncidenciaCuarentena } from '../../../api/actasMermaApi'

const PRENDAS: IncidenciaCuarentena[] = [
  {
    incidenciaId: 'inc-1',
    sku: 'POLTEC-M-BLA',
    nombreProducto: 'Polo técnico DryFit M blanco',
    tipoFalla: 'MANCHADO_PROBADOR',
    fechaReporte: '2026-11-22T15:00:00Z',
    estado: 'EN_CUARENTENA',
  },
  {
    incidenciaId: 'inc-2',
    sku: 'ZAPVEL-38-NEG',
    nombreProducto: 'Zapatilla Velocity 38 negro',
    tipoFalla: 'COSTURA_ROTA',
    fechaReporte: '2026-11-23T15:00:00Z',
    estado: 'EN_CUARENTENA',
  },
]

const ACTA: ActaEmitida = {
  actaNumero: 'ACTA-MERMA-2026-0012',
  totalPrendas: 2,
  incidencias: PRENDAS.map((p) => ({ incidenciaId: p.incidenciaId, estado: 'DERIVADO_ALMACEN' })),
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function abrir() {
  render(
    <ActaPrintPreview
      acta={ACTA}
      prendas={PRENDAS}
      tipoDestino="DEVOLUCION_CENTRAL"
      observaciones="Lote enviado con transporte interno"
      supervisor="SUP-001"
      tiendaId="TIENDA-MIRAFLORES"
      emitidaEn="2026-11-24T20:00:00Z"
    />,
  )
}

describe('ActaPrintPreview (RF-34)', () => {
  it('CA-RF34-03: la cabecera lleva el número correlativo, la fecha, la tienda y el destino', () => {
    abrir()

    const acta = screen.getByRole('article', { name: 'Acta ACTA-MERMA-2026-0012' })
    expect(within(acta).getByText('ACTA-MERMA-2026-0012')).toBeTruthy()
    expect(within(acta).getByText(/^Emitida /)).toBeTruthy()
    expect(within(acta).getByText('TIENDA-MIRAFLORES')).toBeTruthy()
    expect(within(acta).getByText('Devolución a almacén central por garantía')).toBeTruthy()
  })

  it('desglosa cada prenda con su SKU y motivo, y el total', () => {
    abrir()

    const filas = screen.getAllByRole('row').slice(1)
    expect(filas).toHaveLength(2)
    expect(within(filas[0]).getByText('POLTEC-M-BLA')).toBeTruthy()
    expect(within(filas[0]).getByText('Prenda manchada en probador')).toBeTruthy()
    expect(within(filas[1]).getByText('Costura o tela dañada')).toBeTruthy()
    expect(screen.getByText('Total de prendas: 2')).toBeTruthy()
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
