import { describe, expect, it } from 'vitest'
import { getStockStatus } from './inventory'

describe('getStockStatus', () => {
  it('marks products without stock as unavailable', () => {
    expect(getStockStatus(0)).toEqual({
      label: 'Sin stock',
      tone: 'warning',
      isAvailable: false,
    })
  })

  it('warns when only a few units remain', () => {
    expect(getStockStatus(3).label).toBe('Últimas 3 unidades')
    expect(getStockStatus(3).tone).toBe('warning')
  })

  it('shows regular stock for healthy inventory', () => {
    expect(getStockStatus(8)).toEqual({
      label: 'Stock: 8',
      tone: 'neutral',
      isAvailable: true,
    })
  })

  it('sin cantidades de Productos (X-P0-03) muestra solo el estado comercial', () => {
    expect(getStockStatus({ stock: 10, disponibilidad: 'DISPONIBLE', stockConocido: false })).toEqual({
      label: 'Disponible', tone: 'neutral', isAvailable: true,
    })
    expect(getStockStatus({ stock: 3, disponibilidad: 'ULTIMAS_UNIDADES', stockConocido: false })).toEqual({
      label: 'Últimas unidades', tone: 'warning', isAvailable: true,
    })
    expect(getStockStatus({ stock: 0, disponibilidad: 'SOLO_ALMACEN_CENTRAL', stockConocido: false }).label).toBe('Solo en almacén central')
    expect(getStockStatus({ stock: 0, disponibilidad: 'AGOTADO_TOTAL', stockConocido: false })).toEqual({
      label: 'Agotado', tone: 'error', isAvailable: false,
    })
  })

  it('con cantidad conocida mantiene las unidades en el semáforo', () => {
    expect(getStockStatus({ stock: 2, disponibilidad: 'ULTIMAS_UNIDADES', stockConocido: true }).label).toBe('Últimas 2 unidades')
  })
})
