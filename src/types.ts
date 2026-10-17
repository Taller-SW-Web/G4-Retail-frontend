export type Product = {
  id: string
  name: string
  category: string
  price: number
  stock: number
  image: string
  badge?: string
}

export type CartItem = {
  product: Product
  quantity: number
}

export type TipoDocumento = 'DNI' | 'RUC'

export interface ClienteVenta {
  id?: string
  tipoDocumento: TipoDocumento
  numeroDocumento: string
  nombre: string
}

export interface CarritoEspera {
  carritoEsperaId: string
  aliasTicket: string
  items: CartItem[]
  cliente: ClienteVenta | null
  fechaHoraInicio: string
  expiracion: string
}

export interface TotalesCarrito {
  subtotalBruto: number
  descuentoTotal: number
  totalPagar: number
  baseImponible: number
  montoIgv: number
}
