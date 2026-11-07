import { describe, expect, it } from 'vitest'
import { enmascararDocumento, esCorreoValido, esDocumentoValido, evaluarDocumento } from './documento'
import type { TipoDocumento } from '../types'

describe('esDocumentoValido (RF-09)', () => {
  it.each<[TipoDocumento, string]>([
    ['DNI', '12345678'],
    ['RUC', '10456789123'],
    ['RUC', '20100047218'],
    ['CE', '001234567'],
    ['CE', 'AB1234567890'],
    ['PASAPORTE', 'A12345'],
    ['PASAPORTE', 'AB12345678901234'],
  ])('%s %s es válido', (tipo, numero) => {
    expect(esDocumentoValido(tipo, numero)).toBe(true)
  })

  it.each<[TipoDocumento, string]>([
    ['DNI', '1234567'],
    ['DNI', '123456789'],
    ['DNI', '1234567A'],
    ['RUC', '15123456789'],
    ['RUC', '17123456789'],
    ['RUC', '30123456789'],
    ['RUC', '2010004721'],
    ['CE', '12345678'],
    ['CE', '1234567890123'],
    ['CE', 'AB-1234567'],
    ['PASAPORTE', 'A1234'],
    ['PASAPORTE', 'A1234567890123456'],
    ['PASAPORTE', 'AB#12345'],
  ])('%s %s se rechaza', (tipo, numero) => {
    expect(esDocumentoValido(tipo, numero)).toBe(false)
  })
})

describe('enmascararDocumento', () => {
  it('bloquea letras y símbolos en DNI y RUC', () => {
    expect(enmascararDocumento('DNI', '12a3-4 5.6b78')).toBe('12345678')
    expect(enmascararDocumento('RUC', 'RUC: 20-100047218')).toBe('20100047218')
  })

  it('corta en la longitud máxima del tipo', () => {
    expect(enmascararDocumento('DNI', '1234567890')).toBe('12345678')
    expect(enmascararDocumento('RUC', '201000472189999')).toBe('20100047218')
    expect(enmascararDocumento('CE', 'AB12345678901234')).toBe('AB1234567890')
    expect(enmascararDocumento('PASAPORTE', 'X'.repeat(20))).toHaveLength(16)
  })

  it('CE y pasaporte pasan a mayúsculas y descartan lo no alfanumérico', () => {
    expect(enmascararDocumento('CE', 'ab-123 456.7')).toBe('AB1234567')
    expect(enmascararDocumento('PASAPORTE', 'ñp#1234567')).toBe('P1234567')
  })
})

describe('evaluarDocumento (validación en vivo)', () => {
  it('avisa cuántos dígitos faltan sin marcarlo como error', () => {
    const estado = evaluarDocumento('DNI', '1234567')
    expect(estado).toMatchObject({ valido: false, incompleto: true })
    expect(estado.mensaje).toContain('Faltan 1 dígito')
  })

  it('marca el prefijo de RUC no autorizado apenas se escriben 2 dígitos', () => {
    const estado = evaluarDocumento('RUC', '30')
    expect(estado).toMatchObject({ valido: false, incompleto: false })
    expect(estado.mensaje).toContain('Prefijo 30 no autorizado')
  })

  it('un RUC con prefijo correcto e incompleto solo avisa lo que falta', () => {
    expect(evaluarDocumento('RUC', '20100')).toMatchObject({ valido: false, incompleto: true })
  })

  it('indica el rango de caracteres en CE y pasaporte', () => {
    expect(evaluarDocumento('CE', '1234').mensaje).toContain('9 a 12 caracteres')
    expect(evaluarDocumento('PASAPORTE', 'AB').mensaje).toContain('Faltan 4 caracteres')
  })

  it('confirma el documento completo', () => {
    expect(evaluarDocumento('DNI', '12345678')).toEqual({ valido: true, mensaje: 'DNI válido.' })
  })
})

describe('esCorreoValido (RF-09)', () => {
  it.each([
    'rosa@correo..com',
    'rosa@.correo.com',
    'rosa@correo.com.',
    'rosa@-correo.com',
    'rosa@correo-.com',
    'rosa@correo.c',
    'rosa@correo.c0m',
    'rosa@correo',
    'rosa..huaman@correo.com',
    '.rosa@correo.com',
    'rosa.@correo.com',
    'rosa@@correo.com',
    'rosa huaman@correo.com',
  ])('rechaza %s', (email) => {
    expect(esCorreoValido(email)).toBe(false)
  })

  it.each(['rosa@correo.com', 'rosa.huaman@correo.com.pe', 'rosa+tienda@mi-correo.pe', 'r_h-2026@sub.dominio.org'])(
    'acepta %s',
    (email) => {
      expect(esCorreoValido(email)).toBe(true)
    },
  )
})
