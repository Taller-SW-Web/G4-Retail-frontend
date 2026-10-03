import { describe, expect, it } from 'vitest'
import { calcularTotales, calcularVuelto } from './totals'
import { validarDocumento, esEmailValido, soloDigitos } from './validation'
import { formatSoles } from './format'

describe('calcularTotales (RF-12)', () => {
  it('1 prenda de S/ 129.90 sin descuento', () => {
    expect(calcularTotales([{ precioUnitario: 129.9, cantidad: 1 }])).toEqual({
      subtotalBruto: 129.9,
      descuentos: 0,
      baseGravada: 110.08,
      igv: 19.82,
      total: 129.9,
    })
  })

  it('descuento de S/ 25.98 sobre S/ 259.80 sin diferencias de 1 céntimo', () => {
    const t = calcularTotales([{ precioUnitario: 129.9, cantidad: 2 }], 25.98)
    expect(t).toEqual({ subtotalBruto: 259.8, descuentos: 25.98, baseGravada: 198.15, igv: 35.67, total: 233.82 })
  })
})

describe('calcularVuelto (RF-13)', () => {
  it('S/ 120 con billete de S/ 200 → vuelto S/ 80', () => expect(calcularVuelto(120, 200)).toBe(80))
  it('S/ 120 con S/ 100 → faltan S/ 20', () => expect(calcularVuelto(120, 100)).toBe(-20))
})

describe('validación de documentos (RF-09)', () => {
  it('descarta letras', () => expect(soloDigitos('abc', 8)).toBe(''))
  it('DNI de 7 dígitos indica cuántos faltan', () =>
    expect(validarDocumento('DNI', '1234567')).toEqual({ valido: false, ayuda: 'Ingrese 8 dígitos (faltan 1)' }))
  it('DNI de 8 dígitos es válido', () => expect(validarDocumento('DNI', '72345678').valido).toBe(true))
  it('RUC que empieza con 30 es inválido', () =>
    expect(validarDocumento('RUC', '30123456789').error).toBe('Un RUC debe comenzar con 10 o 20'))
  it('correo sin arroba es inválido', () => expect(esEmailValido('cliente.com')).toBe(false))
})

describe('formatSoles', () => {
  it('usa separador de miles y 2 decimales', () => expect(formatSoles(1199.9)).toBe('S/ 1,199.90'))
})
