/**
 * RF-27 / CA-10-06: Cálculo canónico determinista de SHA-256 para integridad de la venta offline.
 * Vector según F10 §7:
 * [terminalPos, turnoId, ventaLocalUuid, correlativoContingencia, fechaHoraOffline,
 *  [[sku, cantidad, precioEnCentimos], ...], totalEnCentimos, efectivoEnCentimos, vueltoEnCentimos, clienteIdO_null]
 */
export async function calcularHashContingencia(params: {
  terminalPos: string
  turnoId: string
  ventaLocalUuid: string
  correlativoContingencia: string
  fechaHoraOffline: string
  items: Array<{ sku: string; cantidad: number; precioUnitario: number }>
  totalNeto: number
  efectivoRecibido: number
  vuelto: number
  clienteId?: string | null
}): Promise<string> {
  const centimos = (n: number) => Math.round(Number(n) * 100)

  const itemsCanon = params.items.map((it) => [
    it.sku,
    it.cantidad,
    centimos(it.precioUnitario),
  ])

  const canon = [
    params.terminalPos,
    params.turnoId,
    params.ventaLocalUuid,
    params.correlativoContingencia,
    params.fechaHoraOffline,
    itemsCanon,
    centimos(params.totalNeto),
    centimos(params.efectivoRecibido),
    centimos(params.vuelto),
    params.clienteId ?? null,
  ]

  const rawJson = JSON.stringify(canon)
  const encoder = new TextEncoder()
  const data = encoder.encode(rawJson)

  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
