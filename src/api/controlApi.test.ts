import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./http', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./http')>()),
  USA_MOCKS: false,
  api: { get: vi.fn().mockResolvedValue([]) },
}))

import { api } from './http'
import {
  esVigente,
  listarCampanasVigentes,
  listarPickupsDelDia,
  listarStockCritico,
  obtenerResumen,
  totalAlertas,
  type CampanaVigente,
} from './controlApi'

afterEach(() => vi.clearAllMocks())

const campana = (desde: string, hasta: string): CampanaVigente => ({
  campanaId: 'CMP-1', titulo: 'X', descripcion: null, tipoDescuento: null, valor: null, codigoCupon: null,
  montoMinimo: null, condiciones: null, vigenteDesde: desde, vigenteHasta: hasta,
})

describe('controlApi contra el backend (F11 · contrato §5.11)', () => {
  it('consulta el resumen del badge', async () => {
    await obtenerResumen()
    expect(api.get).toHaveBeenCalledWith('/api/v1/retail/control/resumen')
  })

  it('RF-29: consulta el stock crítico de la tienda', async () => {
    await listarStockCritico()
    expect(api.get).toHaveBeenCalledWith('/api/v1/retail/control/stock-critico')
  })

  it('RF-30: consulta los pickups del día, con o sin filtro por DNI', async () => {
    await listarPickupsDelDia()
    expect(api.get).toHaveBeenLastCalledWith('/api/v1/retail/control/pickup-pendientes')

    await listarPickupsDelDia(' 45678912 ')
    expect(api.get).toHaveBeenLastCalledWith('/api/v1/retail/control/pickup-pendientes?dni=45678912')
  })

  it('RF-31: consulta las campañas vigentes', async () => {
    await listarCampanasVigentes()
    expect(api.get).toHaveBeenCalledWith('/api/v1/retail/control/campanas-vigentes')
  })
})

describe('reglas de la torre de control', () => {
  it('el badge no suma los contadores nulos de una fuente caída', () => {
    expect(totalAlertas(null)).toBe(0)
    expect(
      totalAlertas({
        pickupPendientes: 3, stockCritico: null, campanasVigentes: 4,
        fuentesNoDisponibles: ['PRODUCTOS_G6'], actualizadoEn: '2026-11-26T15:00:00Z',
      }),
    ).toBe(7)
  })

  it('RF-31: una campaña vencida o futura no está vigente', () => {
    const ahora = new Date('2026-11-26T15:00:00Z')
    expect(esVigente(campana('2026-11-20T05:00:00Z', '2026-11-30T04:59:59Z'), ahora)).toBe(true)
    expect(esVigente(campana('2026-11-01T05:00:00Z', '2026-11-25T04:59:59Z'), ahora)).toBe(false)
    expect(esVigente(campana('2026-12-01T05:00:00Z', '2026-12-31T04:59:59Z'), ahora)).toBe(false)
  })
})
