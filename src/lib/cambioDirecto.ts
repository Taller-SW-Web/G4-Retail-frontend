/**
 * Reglas del cambio directo en pantalla (F9 · RF-25, contrato §5.9).
 *
 * Replican las del backend para que el vendedor vea el tipo de cambio y la diferencia **antes** de
 * confirmar. El backend vuelve a cotizar y decide igual; esto es ergonomía, no la fuente de verdad.
 */
import type { MedioPagoDiferencia } from '../api/cambiosApi'

export type TipoEstimado = 'MISMO_VALOR' | 'MAYOR_VALOR' | 'MENOR_VALOR'

export interface PrendaElegida {
  sku: string
  /** Producto del catálogo: sirve para saber si es el mismo modelo que la devuelta. */
  productoId: string
  nombre: string
  cantidad: number
  precioUnitario: number
}

export interface ResumenCambio {
  credito: number
  totalNuevo: number
  diferencia: number
  tipo: TipoEstimado
  mismoModelo: boolean
}

const redondear = (monto: number) => Math.round(monto * 100) / 100

/**
 * Crédito, total y tipo del cambio.
 *
 * El mismo modelo (mismo producto, otra talla o color, misma cantidad) es siempre `MISMO_VALOR` sin
 * comparar precios, aunque el precio vigente haya cambiado desde la compra.
 */
export function resumirCambio(
  devuelto: { productoId: string | null; cantidad: number; precioPagado: number },
  nuevas: PrendaElegida[],
): ResumenCambio {
  const credito = redondear(devuelto.precioPagado * devuelto.cantidad)
  const totalNuevo = redondear(nuevas.reduce((suma, p) => suma + p.precioUnitario * p.cantidad, 0))
  const unidades = nuevas.reduce((suma, p) => suma + p.cantidad, 0)
  const mismoModelo =
    devuelto.productoId !== null &&
    nuevas.length > 0 &&
    unidades === devuelto.cantidad &&
    nuevas.every((p) => p.productoId === devuelto.productoId)

  let tipo: TipoEstimado
  if (mismoModelo || totalNuevo === credito) tipo = 'MISMO_VALOR'
  else tipo = totalNuevo > credito ? 'MAYOR_VALOR' : 'MENOR_VALOR'

  return {
    credito,
    totalNuevo,
    diferencia: tipo === 'MAYOR_VALOR' ? redondear(totalNuevo - credito) : 0,
    tipo,
    mismoModelo,
  }
}

/** Las reglas de cobro de F5 aplicadas a la diferencia: efectivo suficiente o referencia de voucher. */
export function pagoDiferenciaValido(
  medio: MedioPagoDiferencia,
  diferencia: number,
  recibido: string,
  referencia: string,
): boolean {
  if (medio === 'EFECTIVO') return recibido !== '' && Number(recibido) >= diferencia
  return referencia.trim().length >= 4
}
