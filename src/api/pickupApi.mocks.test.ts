import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./http', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./http')>()),
  USA_MOCKS: true,
}))

import { ApiError } from './http'
import { confirmarEntrega, listarPickups, type EntregaPickup } from './pickupApi'

const almacen = new Map<string, string>()

/** Resuelve la promesa adelantando la latencia simulada del modo VITE_USE_MOCKS. */
async function resolver<T>(promesa: Promise<T>): Promise<T> {
  const resultado = promesa.then(
    (valor) => ({ valor }),
    (error: unknown) => ({ error }),
  )
  await vi.runAllTimersAsync()
  const r = await resultado
  if ('error' in r) throw r.error
  return r.valor
}

async function codigoDeError(entrega: Promise<unknown>): Promise<[number, string]> {
  const error = (await resolver(entrega).catch((e: unknown) => e)) as ApiError
  expect(error).toBeInstanceOf(ApiError)
  return [error.status, error.codigo]
}

const titular: EntregaPickup = { dniRecoge: '45678912', nombreRecoge: 'María González', esTerceroAutorizado: false }

describe('pickupApi en modo simulado: reglas de entrega (F7 · RF-18, RF-19)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    almacen.clear()
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: (clave: string) => almacen.get(clave) ?? null,
        setItem: (clave: string, valor: string) => void almacen.set(clave, valor),
      },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('RF-19: entrega al titular, emite la constancia y el pedido sale de la bandeja', async () => {
    const constancia = await resolver(confirmarEntrega('PED-2026-08910', titular))
    expect(constancia).toMatchObject({ constanciaId: 'CONST-PED-2026-08910', estado: 'ENTREGADO' })

    const bandeja = await resolver(listarPickups())
    expect(bandeja.map((p) => p.pedidoId)).not.toContain('PED-2026-08910')
  })

  it('rechaza un DNI mal formado o un nombre vacío (400)', async () => {
    expect(await codigoDeError(confirmarEntrega('PED-2026-08910', { ...titular, dniRecoge: '123' })))
      .toEqual([400, 'PARAMETRO_INVALIDO'])
    expect(await codigoDeError(confirmarEntrega('PED-2026-08910', { ...titular, nombreRecoge: '  ' })))
      .toEqual([400, 'PARAMETRO_INVALIDO'])
  })

  it('no entrega dos veces ni pedidos que no están en la bandeja (404)', async () => {
    await resolver(confirmarEntrega('PED-2026-08910', titular))
    expect(await codigoDeError(confirmarEntrega('PED-2026-08910', titular))).toEqual([404, 'PEDIDO_NO_ENCONTRADO'])
    expect(await codigoDeError(confirmarEntrega('PED-0000-00000', titular))).toEqual([404, 'PEDIDO_NO_ENCONTRADO'])
  })

  it('no entrega un paquete que todavía no está listo para recojo (409)', async () => {
    const entrega = { ...titular, dniRecoge: '48765432', nombreRecoge: 'Lucero Vargas Paz' }
    expect(await codigoDeError(confirmarEntrega('PED-2026-08932', entrega))).toEqual([409, 'PEDIDO_NO_LISTO_PARA_RECOJO'])
  })

  it('un tercero solo recoge con la carta poder verificada (422)', async () => {
    const tercero = { dniRecoge: '11111111', nombreRecoge: 'Pedro Ruiz', esTerceroAutorizado: true }
    expect(await codigoDeError(confirmarEntrega('PED-2026-08914', tercero))).toEqual([422, 'CARTA_PODER_REQUERIDA'])

    const constancia = await resolver(confirmarEntrega('PED-2026-08914', { ...tercero, cartaPoderVerificada: true }))
    expect(constancia.estado).toBe('ENTREGADO')
  })

  it('el titular debe presentar su propio DNI (422)', async () => {
    const otroDni = { ...titular, dniRecoge: '99999999' }
    expect(await codigoDeError(confirmarEntrega('PED-2026-08897', otroDni))).toEqual([422, 'DNI_NO_COINCIDE_CON_TITULAR'])
  })

  it('si sessionStorage está bloqueado, la bandeja sigue funcionando', async () => {
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: () => { throw new Error('bloqueado') },
        setItem: () => { throw new Error('bloqueado') },
      },
    })
    expect((await resolver(listarPickups())).length).toBeGreaterThan(0)
    expect((await resolver(confirmarEntrega('PED-2026-08871', { ...titular, dniRecoge: '70881234' }))).estado)
      .toBe('ENTREGADO')
  })
})
