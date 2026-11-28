// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { ItemCuarentena } from '../../../api/inventarioApi'
import QuarantineList from './QuarantineList'

const pendiente: ItemCuarentena = {
  incidenciaId: '5b0e3f0a-6c1d-4d3e-9a2b-1f0c7e8d9a10',
  sku: 'CAM-PERU-M-BLA',
  nombreProducto: 'Camiseta Perú (M / Blanco)',
  tipoFalla: 'MANCHADO_PROBADOR',
  fechaReporte: '2026-11-26T15:30:00Z',
  estado: 'PENDIENTE_REPORTE',
}
const enCuarentena: ItemCuarentena = {
  ...pendiente,
  incidenciaId: '9f2c1d0e-0000-0000-0000-000000000001',
  sku: 'ZAP-RUN-42',
  nombreProducto: null,
  tipoFalla: 'EXTRAVIO_NO_UBICADO',
  estado: 'EN_CUARENTENA',
}

afterEach(() => cleanup())

const fila = (texto: string) => screen.getByText(texto).closest('tr') as HTMLElement

describe('QuarantineList (F12 · RF-33)', () => {
  it('CA-RF33-03: lista cada prenda con su número de incidencia, SKU y motivo de retención', () => {
    render(<QuarantineList items={[pendiente, enCuarentena]} />)

    const camiseta = fila('Camiseta Perú (M / Blanco)')
    expect(within(camiseta).getByText('5B0E3F0A')).toBeTruthy()
    expect(within(camiseta).getByText('SKU CAM-PERU-M-BLA')).toBeTruthy()
    expect(within(camiseta).getByText('Prenda manchada en probador')).toBeTruthy()
  })

  it('distingue con badges la incidencia pendiente de Inventario y la ya aceptada', () => {
    render(<QuarantineList items={[pendiente, enCuarentena]} />)

    const pendienteBadge = within(fila('Camiseta Perú (M / Blanco)')).getByText('Pendiente de Inventario')
    expect(pendienteBadge.closest('[data-tone]')?.getAttribute('data-tone')).toBe('warning')
    const aceptadaBadge = within(fila('SKU ZAP-RUN-42')).getByText('En cuarentena')
    expect(aceptadaBadge.closest('[data-tone]')?.getAttribute('data-tone')).toBe('error')
  })

  it('una prenda sin nombre de Productos se muestra igual, con su SKU', () => {
    render(<QuarantineList items={[enCuarentena]} />)

    expect(within(fila('SKU ZAP-RUN-42')).getByText('Prenda sin nombre')).toBeTruthy()
    expect(within(fila('SKU ZAP-RUN-42')).getByText('Artículo extraviado / no ubicado')).toBeTruthy()
  })

  it('sin prendas retenidas muestra el estado vacío', () => {
    render(<QuarantineList items={[]} />)
    expect(screen.getByText('No hay prendas en cuarentena')).toBeTruthy()
  })

  it('si la consulta falla, lo dice', () => {
    render(<QuarantineList items={[]} error="Servicio no disponible" />)
    expect(screen.getByRole('alert').textContent).toContain('Servicio no disponible')
  })
})
