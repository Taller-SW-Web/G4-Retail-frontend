import Badge from '../atoms/Badge'
import { getStockStatus } from '../../lib/inventory'

type StockBadgeProps = {
  stock: number
}

export default function StockBadge({ stock }: StockBadgeProps) {
  const status = getStockStatus(stock)

  return <Badge tone={status.tone}>{status.label}</Badge>
}
