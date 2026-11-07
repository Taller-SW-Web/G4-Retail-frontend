import { describe, expect, it } from 'vitest'
import {
  esDocumentoValido,
  esPickup,
  etiquetaCanal,
  etiquetaEstado,
  formatFechaHoraLima,
  pasosLineaTiempo,
  prendaDelCatalogo,
  tonoEstado,
} from './pedidos'

describe('pedidos (F6)', () => {
  it('acepta DNI de 8 dígitos o RUC de 11 y rechaza lo demás', () => {
    expect(esDocumentoValido('72345678')).toBe(true)
    expect(esDocumentoValido('20123456789')).toBe(true)
    expect(esDocumentoValido('7234567')).toBe(false)
    expect(esDocumentoValido('PED-2026-00412')).toBe(false)
  })

  it('da a cada estado el color semántico del Design System (RF-17)', () => {
    expect(tonoEstado('ENTREGADO')).toBe('success')
    expect(tonoEstado('DESPACHADO')).toBe('info')
    expect(tonoEstado('EN_PREPARACION')).toBe('warning')
    expect(tonoEstado('ANULADO')).toBe('error')
    expect(tonoEstado('OTRO')).toBe('neutral')
    expect(etiquetaEstado('EN_PREPARACION')).toBe('En preparación')
    expect(etiquetaCanal('RETAIL')).toBe('Tienda física')
  })

  it('muestra la hora de Lima aunque la fecha llegue en UTC', () => {
    expect(formatFechaHoraLima('2026-11-06T15:30:00Z')).toBe('06/11/2026 10:30')
    expect(formatFechaHoraLima('2026-11-06T10:30:00-05:00')).toBe('06/11/2026 10:30')
    expect(formatFechaHoraLima(undefined)).toBe('—')
  })

  it('reconoce la modalidad de recojo en tienda', () => {
    expect(esPickup('RECOJO_TIENDA')).toBe(true)
    expect(esPickup('PICKUP')).toBe(true)
    expect(esPickup('DOMICILIO')).toBe(false)
  })

  it('marca los estados ocurridos como completados, resalta el actual y deja pendientes los siguientes', () => {
    const pasos = pasosLineaTiempo(
      [
        { estado: 'CREADO', fecha: '2026-11-01T08:00:00-05:00' },
        { estado: 'PAGADO', fecha: '2026-11-01T08:05:00-05:00' },
        { estado: 'EN_PREPARACION', fecha: '2026-11-01T12:00:00-05:00' },
      ],
      'EN_PREPARACION',
    )
    expect(pasos.map((p) => [p.estado, p.situacion])).toEqual([
      ['CREADO', 'completado'],
      ['PAGADO', 'completado'],
      ['EN_PREPARACION', 'actual'],
      ['DESPACHADO', 'pendiente'],
      ['ENTREGADO', 'pendiente'],
    ])
    expect(pasos[0].fecha).toBe('2026-11-01T08:00:00-05:00')
  })

  it('no dibuja los estados que una venta de mostrador se saltó y cierra en entregado', () => {
    const pasos = pasosLineaTiempo(
      [
        { estado: 'PAGADO', fecha: '2026-11-06T10:00:00-05:00' },
        { estado: 'ENTREGADO', fecha: '2026-11-06T10:01:00-05:00' },
      ],
      'ENTREGADO',
    )
    expect(pasos.map((p) => [p.estado, p.situacion])).toEqual([
      ['PAGADO', 'completado'],
      ['ENTREGADO', 'completado'],
    ])
  })

  it('corta la línea con un nodo de anulación y su motivo', () => {
    const pasos = pasosLineaTiempo(
      [
        { estado: 'CREADO', fecha: '2026-11-01T08:00:00-05:00' },
        { estado: 'PAGADO', fecha: '2026-11-01T08:05:00-05:00' },
        { estado: 'ANULADO', fecha: '2026-11-02T09:00:00-05:00', motivo: 'Solicitado por el cliente' },
      ],
      'ANULADO',
    )
    expect(pasos.map((p) => p.situacion)).toEqual(['completado', 'completado', 'anulado'])
    expect(pasos[2].motivo).toBe('Solicitado por el cliente')
  })

  it('completa foto, talla y color de la prenda con el catálogo de la tienda', () => {
    expect(prendaDelCatalogo('ZAPVEL-41-AZU')).toMatchObject({ talla: '41', color: 'Azul' })
    expect(prendaDelCatalogo('ZAPVEL-41-AZU').imagen).toContain('https://')
    expect(prendaDelCatalogo('SKU-DESCONOCIDO')).toEqual({})
  })
})
