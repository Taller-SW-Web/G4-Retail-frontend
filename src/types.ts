/** Semáforo comercial de Retail (RF-06, contrato §5.2). */
export type Disponibilidad = 'DISPONIBLE' | 'ULTIMAS_UNIDADES' | 'SOLO_ALMACEN_CENTRAL' | 'AGOTADO_TOTAL'

export type Variant = {
  /** SKU vendible: la combinación exacta de talla y color que entra al carrito. */
  sku: string
  /** Etiqueta EAN-13 que lee el lector láser. No es el SKU: son códigos distintos. */
  barcode: string
  size: string
  color: string
  /**
   * Unidades vendibles. Si `stockConocido` es `false`, es solo un tope referencial derivado de la
   * disponibilidad: Productos (G6) no expone cantidades a los canales (X-P0-03) y no se muestra.
   */
  stock: number
  /** Precio vigente del SKU. G6 cotiza por variante y dos tallas pueden costar distinto. */
  price?: number
  disponibilidad?: Disponibilidad
  /** `false` cuando `stockTienda` llegó `null`. Sin el campo se asume conocido (catálogo semilla). */
  stockConocido?: boolean
  /** F12 · RF-33: la prenda tiene una incidencia activa en la tienda y no se puede vender. */
  enCuarentena?: boolean
}

export type Product = {
  id: string
  name: string
  category: string
  price: number
  stock: number
  image: string
  badge?: string
  /** Semáforo del artículo: el mejor estado entre sus variantes. */
  disponibilidad?: Disponibilidad
  stockConocido?: boolean
  /** F12 · RF-33: artículo de talla única en cuarentena (con variantes, se marca cada variante). */
  enCuarentena?: boolean
  /**
   * Variantes de talla y color (RF-05). Es opcional porque no todo artículo las tiene:
   * una mancuerna de 12 kg se vende sin tallas y su ficha no debe inventar una matriz.
   */
  variants?: Variant[]
}

export type CartItem = {
  product: Product
  quantity: number
}

/** Documentos que atiende el mostrador (F3 · RF-09): DNI, RUC, carné de extranjería y pasaporte. */
export type TipoDocumento = 'DNI' | 'RUC' | 'CE' | 'PASAPORTE'

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
  cupon?: string
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
