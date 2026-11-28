import { useEffect, useMemo, useRef, useState } from 'react'
import { ApiError } from '../api/http'
import { calcularCarrito, CUPON_INVALIDO, type CalculoCarrito } from '../api/carritoApi'
import { SKU_EN_CUARENTENA } from '../api/inventarioApi'
import { calcularTotales, skuDeLinea } from '../lib/cart'
import type { CartItem, TotalesCarrito } from '../types'

/** Espera tras el último cambio del carrito antes de pedir el cálculo, para no llamar por cada clic. */
export const ESPERA_CALCULO_MS = 300

export interface ResultadoTotales {
  totales: TotalesCarrito
  /** Referencia de la evaluación de precios que viaja en la venta (§5.5). */
  evaluacionId?: string
  /** Promoción o cupón aplicado por línea, tal como lo informa Productos (G6). */
  promociones: string[]
  /** El cupón ingresado no existe, venció o no aplica: no se descuenta, pero no bloquea (§5.4). */
  cuponInvalido: boolean
  /** Mensaje del `422 SKU_EN_CUARENTENA`: alguna prenda del carrito quedó bloqueada (RF-33). */
  bloqueoCuarentena: string | null
  /** El total viene del cálculo local (sin conexión o sin respuesta): no incluye cupones. */
  estimado: boolean
  calculando: boolean
}

/**
 * Totales del carrito calculados por Retail (F4, RF-11 y RF-12; contrato §5.4).
 *
 * El precio, las promociones y los cupones los resuelve el backend con Productos (G6). Mientras
 * responde, o si no hay conexión, se muestra el cálculo local sin descuentos, marcado como estimado:
 * así el vendedor nunca ve un descuento que el backend luego no aplique.
 */
export function useTotalesCarrito(items: CartItem[], cupon: string): ResultadoTotales {
  const local = useMemo(() => calcularTotales(items), [items])
  const [calculo, setCalculo] = useState<CalculoCarrito | null>(null)
  const [bloqueoCuarentena, setBloqueoCuarentena] = useState<string | null>(null)
  const [calculando, setCalculando] = useState(false)
  const ultimaPeticion = useRef(0)

  useEffect(() => {
    const id = ++ultimaPeticion.current
    if (items.length === 0) {
      setCalculo(null)
      setBloqueoCuarentena(null)
      setCalculando(false)
      return
    }
    setCalculando(true)
    const temporizador = setTimeout(() => {
      const precios = Object.fromEntries(items.map((item) => [skuDeLinea(item), item.product.price]))
      calcularCarrito(
        {
          items: items.map((item) => ({ sku: skuDeLinea(item), cantidad: item.quantity })),
          cupon: cupon.trim() || undefined,
        },
        precios,
      )
        .then((resultado) => {
          if (id !== ultimaPeticion.current) return
          setCalculo(resultado)
          setBloqueoCuarentena(null)
        })
        .catch((error: unknown) => {
          if (id !== ultimaPeticion.current) return
          setCalculo(null)
          setBloqueoCuarentena(
            error instanceof ApiError && error.codigo === SKU_EN_CUARENTENA
              ? error.problema.detail ?? 'PRODUCTO BLOQUEADO POR CUARENTENA'
              : null,
          )
        })
        .finally(() => {
          if (id === ultimaPeticion.current) setCalculando(false)
        })
    }, ESPERA_CALCULO_MS)
    return () => clearTimeout(temporizador)
  }, [items, cupon])

  if (!calculo || items.length === 0) {
    return {
      totales: local,
      promociones: [],
      cuponInvalido: false,
      bloqueoCuarentena,
      estimado: items.length > 0,
      calculando,
    }
  }

  return {
    totales: {
      subtotalBruto: calculo.subtotalBruto,
      descuentoTotal: calculo.descuentoTotal,
      totalPagar: calculo.totalPagar,
      baseImponible: calculo.baseImponible,
      montoIgv: calculo.montoIgv,
    },
    evaluacionId: calculo.evaluacionId ?? undefined,
    promociones: [...new Set(calculo.lineas.map((l) => l.promocionAplicada).filter((p): p is string => !!p))],
    cuponInvalido: calculo.advertencias.includes(CUPON_INVALIDO),
    bloqueoCuarentena: null,
    estimado: false,
    calculando,
  }
}
