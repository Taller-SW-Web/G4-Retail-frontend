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
})
