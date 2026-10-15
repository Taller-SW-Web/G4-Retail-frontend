export type StockStatus = {
  label: string
  tone: 'neutral' | 'warning'
  isAvailable: boolean
}

export function getStockStatus(stock: number): StockStatus {
  if (stock <= 0) return { label: 'Sin stock', tone: 'warning', isAvailable: false }
  if (stock <= 5) return { label: `Últimas ${stock} unidades`, tone: 'warning', isAvailable: true }
  return { label: `Stock: ${stock}`, tone: 'neutral', isAvailable: true }
}
