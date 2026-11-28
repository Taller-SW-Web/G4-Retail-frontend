import type { Disponibilidad } from '../types'

export type StockStatus = {
  label: string
  tone: 'neutral' | 'warning' | 'error'
  isAvailable: boolean
}

/** Lo que se sabe del stock de un artículo o variante (RF-06). */
export type StockInfo = {
  stock: number
  disponibilidad?: Disponibilidad
  /** `false` si Productos (G6) no informó la cantidad (`stockTienda: null`, X-P0-03). */
  stockConocido?: boolean
}

/**
 * Semáforo sin cantidades: cuando Productos no expone unidades, se informa el estado comercial y no
 * un número inventado.
 */
function estadoSinCantidad(disponibilidad: Disponibilidad | undefined, stock: number): StockStatus {
  switch (disponibilidad) {
    case 'ULTIMAS_UNIDADES':
      return { label: 'Últimas unidades', tone: 'warning', isAvailable: stock > 0 }
    case 'SOLO_ALMACEN_CENTRAL':
      return { label: 'Solo en almacén central', tone: 'warning', isAvailable: false }
    case 'AGOTADO_TOTAL':
      return { label: 'Agotado', tone: 'error', isAvailable: false }
    default:
      return stock > 0
        ? { label: 'Disponible', tone: 'neutral', isAvailable: true }
        : { label: 'Sin stock', tone: 'warning', isAvailable: false }
  }
}

/**
 * Semáforo de stock del POS (RF-06).
 *
 * Acepta el número de unidades (catálogo semilla) o lo que se sabe del artículo. Con `stockConocido`
 * en `false` muestra solo el estado comercial.
 */
export function getStockStatus(info: number | StockInfo): StockStatus {
  const { stock, disponibilidad, stockConocido = true } = typeof info === 'number' ? { stock: info } : info
  if (!stockConocido) return estadoSinCantidad(disponibilidad, stock)
  if (disponibilidad === 'SOLO_ALMACEN_CENTRAL') return estadoSinCantidad(disponibilidad, stock)
  if (stock <= 0) return { label: 'Sin stock', tone: 'warning', isAvailable: false }
  if (stock <= 5) return { label: `Últimas ${stock} unidades`, tone: 'warning', isAvailable: true }
  return { label: `Stock: ${stock}`, tone: 'neutral', isAvailable: true }
}
