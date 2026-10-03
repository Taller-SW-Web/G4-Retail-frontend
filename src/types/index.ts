// Modelos según specs/api-contracts.md

export type Rol = 'VENDEDOR' | 'CAJERO' | 'SUPERVISOR'

export interface Usuario {
  id: string
  email: string
  nombres: string
  apellidos: string
  codigoVendedor: string
  rol: Rol
  tiendaId: string
  activo: boolean
}

export interface LoginResponse {
  token: string
  usuario: Usuario
}

export interface Variante {
  sku: string
  codigoBarras: string
  talla: string
  color: string
  stockTienda: number
  stockAlmacenCentral: number
  /** Solo si la talla tiene precio diferenciado; si no, aplica precioBase. */
  precio?: number
}

export interface Producto {
  productoId: string
  nombre: string
  marca: string
  categoria: string
  disciplina: string
  precioBase: number
  variantes: Variante[]
}

export interface CatalogoResponse {
  total: number
  items: Producto[]
}

export interface CatalogoQuery {
  query?: string
  categoria?: string
  disciplina?: string
  marca?: string
  tiendaId?: string
}

export type TipoDocumento = 'DNI' | 'RUC'

/** Cliente asociado a la venta en curso. */
export interface ClienteVenta {
  id?: string
  tipoDocumento: TipoDocumento
  numeroDocumento: string
  nombre: string
}

export interface ClienteBusqueda {
  id: string
  nombre: string
  documentoEnmascarado: string
}

export interface AltaClienteRequest {
  canalOrigen: 'RETAIL'
  tipoDocumento: TipoDocumento
  numeroDocumento: string
  nombres: string
  apellidos: string
  email: string
  telefono: string
}

export interface ClienteCreado extends Omit<AltaClienteRequest, 'canalOrigen'> {
  id: string
  estado: string
}

export interface ItemCarrito {
  sku: string
  productoId: string
  nombre: string
  categoria: string
  talla: string
  color: string
  precioUnitario: number
  cantidad: number
  stockTienda: number
}

export interface CarritoEspera {
  carritoEsperaId: string
  aliasTicket: string
  items: ItemCarrito[]
  cliente: ClienteVenta | null
  fechaHoraInicio: string
  expiracion: string
}

export type MedioPago = 'EFECTIVO' | 'TARJETA_POS'
export type TipoComprobante = 'BOLETA' | 'FACTURA'

export interface Pago {
  medioPago: MedioPago
  monto: number
  montoRecibido?: number
  vuelto?: number
  referenciaOperacion?: string
}

export interface FinalizarVentaRequest {
  canal: 'RETAIL'
  tiendaId: string
  vendedorId: string
  clienteId?: string
  emitirTicketRegalo: boolean
  items: { sku: string; cantidad: number; precioFinal: number }[]
  pago: Pago
  comprobante: { tipo: TipoComprobante; numeroDocumento: string; razonSocial: string }
}

export interface FinalizarVentaResponse {
  pedidoId: string
  estado: string
  comprobante: {
    serie: string
    correlativo: string
    subtotal: number
    igv: number
    total: number
    fechaEmision: string
  }
  ticketRegalo?: { codigoCanje: string; fechaLimiteCambio: string; mensaje: string }
}

/** Venta ya cobrada, con lo necesario para pintar el ticket (RF-15). */
export interface VentaFinalizada {
  respuesta: FinalizarVentaResponse
  items: ItemCarrito[]
  cliente: ClienteVenta
  pago: Pago
  tipoComprobante: TipoComprobante
  vendedor: string
}

export interface ArticuloBulto {
  sku: string
  nombre: string
  talla: string
  color: string
  categoria: string
  cantidad: number
}

export interface PedidoPickup {
  bultoId: string
  pedidoId: string
  codigoTracking: string
  clienteNombre: string
  clienteDni: string
  anaquelUbicacion: string
  fechaArriboTienda: string
  estado: 'LISTO_PARA_RECOJO' | 'EN_PREPARACION' | 'EN_CAMINO_A_TIENDA'
  articulos: ArticuloBulto[]
}

export interface ConfirmarEntregaRequest {
  pedidoId: string
  dniRecoge: string
  nombreRecoge: string
  esTitular: boolean
  encargadoEntregaId: string
}

export interface ConfirmarEntregaResponse {
  status: string
  fechaHora: string
}

export interface EstadoCaja {
  estado: 'ABIERTA' | 'CERRADA'
  sesionId?: string
  terminalPos?: string
  cajero?: string
  fechaHoraApertura?: string
}

export interface CierreCajaResponse {
  sesionId: string
  saldoInicial: number
  ventasEfectivoTotal: number
  ventasTarjetaTotal: number
  ingresosMenores: number
  egresosMenores: number
  saldoSistema: number
  saldoDeclarado: number
  diferencia: number
  estado: 'CERRADA' | 'OBSERVADA'
  reporteZUrl: string
}
