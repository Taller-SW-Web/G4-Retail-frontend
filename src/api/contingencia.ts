import { api, USA_MOCKS } from './http'
import type {
  SincronizacionOfflineRequestPayload,
  SincronizacionOfflineResponsePayload,
} from '../types/contingencia'

/**
 * RF-28 / Contrato §5.10: Sincronización batch de ventas de contingencia offline.
 */
export async function sincronizarLoteContingencia(
  payload: SincronizacionOfflineRequestPayload
): Promise<SincronizacionOfflineResponsePayload> {
  if (USA_MOCKS) {
    return {
      totalProcesados: payload.lote.length,
      resultados: payload.lote.map((v, i) => ({
        ventaLocalUuid: v.ventaLocalUuid,
        estado: 'RESINCRONIZADO',
        pedidoId: `PED-MOCK-${Date.now()}-${i + 1}`,
        comprobante: `B010-${String(i + 1).padStart(8, '0')}`,
      })),
    }
  }

  return api.post<SincronizacionOfflineResponsePayload>(
    '/api/v1/retail/contingencia/sincronizar',
    payload
  )
}
