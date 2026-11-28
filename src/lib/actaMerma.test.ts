import { describe, expect, it } from 'vitest'
import { motivoParaNoEmitir } from './actaMerma'
import { emitirActa, estadoSegunDestino, listarCuarentena, puedeEntrarAlActa } from '../api/actasMermaApi'

describe('acta de merma (RF-34)', () => {
  it('CA-RF34-04: sin prendas seleccionadas no se puede emitir', () => {
    expect(motivoParaNoEmitir([], 'DEVOLUCION_CENTRAL')).toBe(
      'Selecciona al menos una prenda en cuarentena para emitir el acta.',
    )
  })

  it('exige elegir el destino de las prendas', () => {
    expect(motivoParaNoEmitir(['inc-0001'], null)).toBe('Elige el destino de las prendas.')
  })

  it('con prendas y destino se puede emitir', () => {
    expect(motivoParaNoEmitir(['inc-0001'], 'BAJA_DEFINITIVA')).toBeNull()
  })
})

describe('acta de merma en modo simulado', () => {
  it('CA-RF34-01: con devolución central las prendas pasan a DERIVADO_ALMACEN y salen de la cuarentena', async () => {
    const antes = (await listarCuarentena()).filter(puedeEntrarAlActa)

    const acta = await emitirActa({ incidenciasIds: [antes[0].incidenciaId], tipoDestino: 'DEVOLUCION_CENTRAL' })

    expect(acta.actaNumero).toMatch(/^ACTA-MERMA-\d{4}-\d{4}$/)
    expect(acta.totalPrendas).toBe(1)
    expect(acta.incidencias[0]).toMatchObject({ sku: antes[0].sku, estado: 'DERIVADO_ALMACEN' })
    const despues = await listarCuarentena()
    expect(despues.map((p) => p.incidenciaId)).not.toContain(antes[0].incidenciaId)
  })

  it('rechaza una prenda que ya salió de la cuarentena', async () => {
    const [prenda] = (await listarCuarentena()).filter(puedeEntrarAlActa)
    await emitirActa({ incidenciasIds: [prenda.incidenciaId], tipoDestino: 'AJUSTE_PERDIDA' })

    await expect(
      emitirActa({ incidenciasIds: [prenda.incidenciaId], tipoDestino: 'AJUSTE_PERDIDA' }),
    ).rejects.toMatchObject({ status: 409, codigo: 'INCIDENCIA_NO_EN_CUARENTENA' })
  })
})

describe('estado de las prendas según el destino (contrato §5.12)', () => {
  it('solo la devolución central deja la prenda en DERIVADO_ALMACEN; la baja y el ajuste, en BAJA_DEFINITIVA', () => {
    expect(estadoSegunDestino('DEVOLUCION_CENTRAL')).toBe('DERIVADO_ALMACEN')
    expect(estadoSegunDestino('BAJA_DEFINITIVA')).toBe('BAJA_DEFINITIVA')
    expect(estadoSegunDestino('AJUSTE_PERDIDA')).toBe('BAJA_DEFINITIVA')
  })

  it('una prenda en PENDIENTE_REPORTE no puede entrar al acta', async () => {
    const pendiente = (await listarCuarentena()).find((p) => p.estado === 'PENDIENTE_REPORTE')!

    await expect(
      emitirActa({ incidenciasIds: [pendiente.incidenciaId], tipoDestino: 'DEVOLUCION_CENTRAL' }),
    ).rejects.toMatchObject({ status: 409, codigo: 'INCIDENCIA_NO_EN_CUARENTENA' })
  })
})
