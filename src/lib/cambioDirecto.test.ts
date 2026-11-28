import { describe, expect, it } from 'vitest'
import { pagoDiferenciaValido, resumirCambio, type PrendaElegida } from './cambioDirecto'

const POLO = { productoId: 'PROD-104', cantidad: 1, precioPagado: 59.9 }

const prenda = (sku: string, productoId: string, precioUnitario: number, cantidad = 1): PrendaElegida => ({
  sku,
  productoId,
  nombre: sku,
  cantidad,
  precioUnitario,
})

describe('resumen del cambio directo (contrato §5.9)', () => {
  it('mismo modelo en otra talla es mismo valor aunque el precio vigente haya subido', () => {
    const resumen = resumirCambio(POLO, [prenda('POLTEC-L-AZU', 'PROD-104', 69.9)])

    expect(resumen).toMatchObject({ tipo: 'MISMO_VALOR', diferencia: 0, mismoModelo: true, credito: 59.9 })
  })

  it('otro modelo más caro es mayor valor y se cobra solo la diferencia', () => {
    const resumen = resumirCambio(POLO, [prenda('TOPDE-M-NEG', 'PROD-103', 89)])

    expect(resumen).toMatchObject({ tipo: 'MAYOR_VALOR', totalNuevo: 89, diferencia: 29.1 })
  })

  it('otro modelo más barato es menor valor, que no se permite', () => {
    const resumen = resumirCambio({ productoId: 'PROD-101', cantidad: 1, precioPagado: 249 }, [
      prenda('POLTEC-S-BLA', 'PROD-104', 59.9),
    ])

    expect(resumen.tipo).toBe('MENOR_VALOR')
    expect(resumen.diferencia).toBe(0)
  })

  it('el mismo producto en otra cantidad ya no es mismo modelo: se comparan precios', () => {
    const resumen = resumirCambio(POLO, [prenda('POLTEC-L-AZU', 'PROD-104', 59.9, 2)])

    expect(resumen).toMatchObject({ mismoModelo: false, tipo: 'MAYOR_VALOR', diferencia: 59.9 })
  })
})

describe('pago de la diferencia (reglas de F5)', () => {
  it('en efectivo exige recibir al menos la diferencia', () => {
    expect(pagoDiferenciaValido('EFECTIVO', 29.1, '20', '')).toBe(false)
    expect(pagoDiferenciaValido('EFECTIVO', 29.1, '30', '')).toBe(true)
  })

  it('con tarjeta exige una referencia de al menos 4 caracteres', () => {
    expect(pagoDiferenciaValido('TARJETA_POS', 29.1, '', '12')).toBe(false)
    expect(pagoDiferenciaValido('TARJETA_POS', 29.1, '', '123456')).toBe(true)
  })
})
