import { describe, expect, it } from 'vitest'
import { evaluarInspeccion } from './inspeccion'
import { esBoletaValida, normalizarBoleta } from '../api/cambiosApi'

const COMPLETA = { etiquetasIntactas: true, sinSignosUso: true, empaqueOriginal: true }

describe('evaluarInspeccion (RF-24)', () => {
  it('bloquea un cambio de talla sin etiquetas intactas', () => {
    const resultado = evaluarInspeccion('CAMBIO_TALLA', { ...COMPLETA, etiquetasIntactas: false })

    expect(resultado.puedeAprobar).toBe(false)
    expect(resultado.faltantes).toEqual(['Etiquetas originales intactas'])
  })

  it('permite un cambio de talla con el checklist completo', () => {
    expect(evaluarInspeccion('CAMBIO_TALLA', COMPLETA).puedeAprobar).toBe(true)
  })

  it('exige lo mismo para un cambio de modelo', () => {
    expect(evaluarInspeccion('CAMBIO_MODELO', { ...COMPLETA, sinSignosUso: false }).puedeAprobar).toBe(false)
  })

  it('el empaque original no bloquea', () => {
    expect(evaluarInspeccion('CAMBIO_TALLA', { ...COMPLETA, empaqueOriginal: false }).puedeAprobar).toBe(true)
  })

  it('una falla de fábrica no emite vale: se deriva a Postventa como garantía', () => {
    const resultado = evaluarInspeccion('FALLA_FABRICA', {
      etiquetasIntactas: false,
      sinSignosUso: false,
      empaqueOriginal: false,
    })

    expect(resultado.puedeAprobar).toBe(false)
    expect(resultado.porGarantia).toBe(true)
    expect(resultado.faltantes).toEqual([])
  })
})

describe('formato de boleta', () => {
  it('acepta serie y correlativo de 8 dígitos, aunque llegue con espacios o en minúsculas', () => {
    expect(esBoletaValida('B001-00000045')).toBe(true)
    expect(esBoletaValida('  b001-00000045 ')).toBe(true)
    expect(normalizarBoleta('  b001-00000045 ')).toBe('B001-00000045')
  })

  it('rechaza correlativos cortos y series desconocidas', () => {
    expect(esBoletaValida('B001-00045')).toBe(false)
    expect(esBoletaValida('X001-00000045')).toBe(false)
  })
})
