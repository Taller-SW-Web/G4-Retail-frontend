/**
 * Doble del cálculo del carrito (§5.4) para la demo sin backend (`VITE_USE_MOCKS=true`).
 *
 * Imita al backend: aplica los cupones de ejemplo de las campañas simuladas de F11 y devuelve
 * `CUPON_INVALIDO` en `advertencias` para cualquier otro, sin bloquear. Con el backend real este
 * archivo no se usa.
 */
import type { CalculoCarrito, CalculoCarritoRequest } from '../carritoApi'

/** Cupones de las campañas de ejemplo (`CAMPANAS_EJEMPLO` de `controlApi`), con su porcentaje. */
const CUPONES_SIMULADOS: Record<string, number> = { VERANO2026: 10, GOAL2026: 30 }

const redondear = (monto: number) => Math.round(monto * 100) / 100

export function calcularCarritoSimulado(
  { items, cupon }: CalculoCarritoRequest,
  precios: Record<string, number>,
): CalculoCarrito {
  const codigo = cupon?.trim().toUpperCase()
  const porcentaje = codigo ? CUPONES_SIMULADOS[codigo] ?? 0 : 0
  const lineas = items.map(({ sku, cantidad }) => {
    const precioUnitario = precios[sku] ?? 0
    const bruto = redondear(precioUnitario * cantidad)
    const descuento = redondear((bruto * porcentaje) / 100)
    return {
      sku,
      cantidad,
      precioUnitario,
      descuento,
      precioFinal: redondear(bruto - descuento),
      promocionAplicada: porcentaje ? `${porcentaje}% Cupón ${codigo}` : null,
    }
  })
  const subtotalBruto = redondear(lineas.reduce((t, l) => t + l.precioUnitario * l.cantidad, 0))
  const descuentoTotal = redondear(lineas.reduce((t, l) => t + l.descuento, 0))
  const totalPagar = Math.max(0, redondear(subtotalBruto - descuentoTotal))
  const baseImponible = redondear(totalPagar / 1.18)
  return {
    lineas,
    subtotalBruto,
    descuentoTotal,
    totalPagar,
    baseImponible,
    montoIgv: redondear(totalPagar - baseImponible),
    moneda: 'PEN',
    evaluacionId: porcentaje ? `EVAL-SIMULADA-${codigo}` : null,
    advertencias: codigo && !porcentaje ? ['CUPON_INVALIDO'] : [],
  }
}
