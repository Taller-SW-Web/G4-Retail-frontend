import { IconAlertTriangle, IconBuildingWarehouse, IconCircleCheck, IconCircleX } from '@tabler/icons-react'
import Badge from '../atoms/Badge'
import { getStockStatus, type StockInfo } from '../../lib/inventory'

type StockBadgeProps = StockInfo

/** Semáforo de stock (RF-06): el estado va con texto e icono, nunca solo con color. */
export default function StockBadge({ stock, disponibilidad, stockConocido }: StockBadgeProps) {
  const status = getStockStatus({ stock, disponibilidad, stockConocido })
  const Icono =
    disponibilidad === 'SOLO_ALMACEN_CENTRAL' && !status.isAvailable
      ? IconBuildingWarehouse
      : !status.isAvailable
        ? IconCircleX
        : status.tone === 'warning'
          ? IconAlertTriangle
          : IconCircleCheck

  return (
    <Badge tone={status.tone}>
      <Icono size={14} aria-hidden="true" className="mr-1" />
      {status.label}
    </Badge>
  )
}
