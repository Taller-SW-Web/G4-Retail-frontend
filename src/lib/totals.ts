import type { ItemCarrito } from '../types'

export const IGV = 0.18

const aCentimos = (monto: number) => Math.round(monto * 100)

export interface Totales {
  subtotalBruto: number
  descuentos: number
  baseGravada: number
  igv: number
  total: number
}

/**
 * RF-12: los precios de lista ya incluyen IGV. Se opera en céntimos y el IGV se
 * obtiene por diferencia para que base + IGV sume exactamente el total.
 */
export function calcularTotales(items: Pick<ItemCarrito, 'precioUnitario' | 'cantidad'>[], descuentos = 0): Totales {
  const bruto = items.reduce((suma, i) => suma + aCentimos(i.precioUnitario) * i.cantidad, 0)
  const total = Math.max(bruto - aCentimos(descuentos), 0)
  const base = Math.round(total / (1 + IGV))
  return {
    subtotalBruto: bruto / 100,
    descuentos: (bruto - total) / 100,
    baseGravada: base / 100,
    igv: (total - base) / 100,
    total: total / 100,
  }
}

export const totalArticulos = (items: Pick<ItemCarrito, 'cantidad'>[]) =>
  items.reduce((suma, i) => suma + i.cantidad, 0)

/** RF-13: diferencia entre lo recibido y el total (negativo = falta dinero). */
export const calcularVuelto = (total: number, recibido: number) => (aCentimos(recibido) - aCentimos(total)) / 100

/** RF-15: SUNAT exige identificar al cliente con DNI desde este monto. */
export const MONTO_BOLETA_REQUIERE_DNI = 700
