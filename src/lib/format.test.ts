import { describe, expect, it } from 'vitest'
import { formatCurrency } from './format'

describe('formatCurrency', () => {
  it('formats soles with two decimal places', () => {
    expect(formatCurrency(249)).toBe('S/ 249.00')
    expect(formatCurrency(89.5)).toBe('S/ 89.50')
  })

  it('groups thousands', () => {
    expect(formatCurrency(1250)).toBe('S/ 1,250.00')
  })
})
