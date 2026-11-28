/**
 * Cálculo del carrito en el backend (F4, contrato §5.4 `POST /api/v1/retail/carritos/calcular`).
 *
 * El navegador solo manda SKU y cantidad: el precio, las promociones y los cupones vigentes los
 * resuelve Retail con Productos (G6, `POST /promociones/evaluar`). Un cupón inválido no bloquea:
 * vuelve en `advertencias` (`CUPON_INVALIDO`) y no se aplica.
 */
import { api, USA_MOCKS } from './http'
import { calcularCarritoSimulado } from './mock/carrito'

export interface CalculoCarritoRequest {
  items: { sku: string; cantidad: number }[]
  cupon?: string
}

export interface LineaCalculo {
  sku: string
  cantidad: number
  precioUnitario: number
  descuento: number
  precioFinal: number
  promocionAplicada?: string | null
}

export interface CalculoCarrito {
  lineas: LineaCalculo[]
  subtotalBruto: number
  descuentoTotal: number
  totalPagar: number
  baseImponible: number
  montoIgv: number
  moneda: string
  evaluacionId?: string | null
  advertencias: string[]
}

/** Advertencia del backend cuando el cupón no existe, venció o no aplica al canal (§5.4). */
export const CUPON_INVALIDO = 'CUPON_INVALIDO'

/**
 * @param preciosLocales solo para el modo simulado (`VITE_USE_MOCKS`): precio por SKU del catálogo
 *        de ejemplo. Con el backend real no se envían.
 */
export function calcularCarrito(
  peticion: CalculoCarritoRequest,
  preciosLocales: Record<string, number> = {},
): Promise<CalculoCarrito> {
  if (USA_MOCKS) return Promise.resolve(calcularCarritoSimulado(peticion, preciosLocales))
  return api.post<CalculoCarrito>('/api/v1/retail/carritos/calcular', peticion)
}
