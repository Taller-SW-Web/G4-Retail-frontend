import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./http', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./http')>()),
  USA_MOCKS: false,
  api: {
    get: vi.fn().mockResolvedValue([]),
    post: vi.fn().mockResolvedValue({ incidenciaId: 'inc-1', estado: 'PENDIENTE_REPORTE', sku: 'ZAP-42' }),
  },
}))

import { ApiError, api } from './http'
import { esErrorCuarentena, etiquetaFalla, listarCuarentena, reportarIncidencia } from './inventarioApi'

afterEach(() => vi.clearAllMocks())

describe('inventarioApi contra el backend (F12 · contrato §5.12)', () => {
  it('RF-32: reporta la incidencia con su Idempotency-Key', async () => {
    const datos = { sku: 'ZAP-42', tipoFalla: 'COSTURA_ROTA' as const, detalleObservacion: 'Costura abierta' }

    const respuesta = await reportarIncidencia(datos, 'clave-123')

    expect(api.post).toHaveBeenCalledWith('/api/v1/retail/inventario/incidencias', datos, { 'Idempotency-Key': 'clave-123' })
    expect(respuesta.estado).toBe('PENDIENTE_REPORTE')
  })

  it('RF-33: consulta la bandeja de cuarentena de la tienda', async () => {
    await listarCuarentena()
    expect(api.get).toHaveBeenCalledWith('/api/v1/retail/inventario/cuarentena')
  })

  it('reconoce el rechazo 422 SKU_EN_CUARENTENA del carrito o el cambio', () => {
    expect(esErrorCuarentena(new ApiError(422, { code: 'SKU_EN_CUARENTENA' }))).toBe(true)
    expect(esErrorCuarentena(new ApiError(422, { code: 'CAMBIO_MENOR_VALOR' }))).toBe(false)
    expect(esErrorCuarentena(new Error('otro'))).toBe(false)
  })

  it('traduce el tipo de falla a la etiqueta que ve el vendedor', () => {
    expect(etiquetaFalla('EXTRAVIO_NO_UBICADO')).toBe('Artículo extraviado / no ubicado')
  })
})
