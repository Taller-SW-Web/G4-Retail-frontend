import { IconAlertTriangle, IconBuildingWarehouse, IconCircleCheck, IconCircleX } from '@tabler/icons-react'
import { Badge } from '../atoms/Badge'

/** RF-06: hasta este stock en tienda se avisa de "últimas unidades". */
export const STOCK_BAJO = 3

export type NivelStock = 'DISPONIBLE' | 'ULTIMAS' | 'SOLO_CENTRAL' | 'AGOTADO'

export function nivelStock(stockTienda: number, stockAlmacenCentral: number): NivelStock {
  if (stockTienda > STOCK_BAJO) return 'DISPONIBLE'
  if (stockTienda > 0) return 'ULTIMAS'
  return stockAlmacenCentral > 0 ? 'SOLO_CENTRAL' : 'AGOTADO'
}

interface StockBadgeProps {
  stockTienda: number
  stockAlmacenCentral: number
}

/** Semáforo de inventario tienda vs. almacén central (RF-06). */
export function StockBadge({ stockTienda, stockAlmacenCentral }: StockBadgeProps) {
  switch (nivelStock(stockTienda, stockAlmacenCentral)) {
    case 'DISPONIBLE':
      return (
        <Badge tono="success" icon={<IconCircleCheck size={16} aria-hidden />}>
          {stockTienda} unidades en tienda
        </Badge>
      )
    case 'ULTIMAS':
      return (
        <Badge tono="warning" icon={<IconAlertTriangle size={16} aria-hidden />}>
          {stockTienda === 1 ? '¡Última unidad en tienda!' : `¡Últimas ${stockTienda} unidades en tienda!`}
        </Badge>
      )
    case 'SOLO_CENTRAL':
      return (
        <Badge tono="info" icon={<IconBuildingWarehouse size={16} aria-hidden />}>
          Agotado en tienda — Disponible en Almacén Central ({stockAlmacenCentral} unid.)
        </Badge>
      )
    case 'AGOTADO':
      return (
        <Badge tono="error" icon={<IconCircleX size={16} aria-hidden />}>
          Agotado en toda la cadena
        </Badge>
      )
  }
}
