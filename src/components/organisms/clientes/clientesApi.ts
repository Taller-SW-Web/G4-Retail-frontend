/**
 * Clientes en mostrador (F3 · RF-07, RF-08, RF-09).
 *
 * Vive dentro de `clientes/` porque solo lo consumen la barra de identificación y el alta rápida:
 * los dos endpoints del backend de F3 y los tipos que comparten ambos componentes.
 *
 * La consulta al padrón va contra el **servicio real**, igual que `GET /retail/perfil`: el alta
 * rápida se apoya en que un documento inexistente responda `404`, así que dejar esa ruta en un mock
 * escondería justo el camino que hay que demostrar. Las rutas son las que fija el documento de
 * reparto de la Semana 8: `GET /api/v1/retail/clientes?tipoDocumento=DNI&numeroDocumento={dni}` y
 * `POST /api/v1/retail/clientes`.
 */
import { api } from '../../../api/http'

/** Documentos que atiende el mostrador: DNI para persona natural y RUC para empresa (RF-09). */
export type TipoDocumento = 'DNI' | 'RUC'

/**
 * Cliente ya listo para viajar en la orden de venta.
 *
 * Sin `id` el cliente no existe en el padrón de Retail: ese es el caso del RUC, que solo se captura
 * para la factura y no se consulta.
 */
export interface ClienteVenta {
  id?: string
  tipoDocumento: TipoDocumento
  numeroDocumento: string
  nombre: string
}

/** Respuesta de los dos endpoints; espeja `ClienteResponse` del backend. */
export interface ClienteResponse {
  clienteId: string
  tipoDocumento: TipoDocumento
  numeroDocumento: string
  nombreCompleto: string
  email?: string
  telefono?: string
}

/** Cuerpo de `POST /api/v1/retail/clientes`; espeja `ClienteAltaRapidaRequest`. */
export interface ClienteAltaRapidaRequest {
  canalOrigen: 'RETAIL'
  tipoDocumento: 'DNI'
  numeroDocumento: string
  nombres: string
  apellidos: string
  email: string
  telefono: string
}

/** Responde `404` cuando el documento no está en el padrón: esa es la señal para el alta (RF-08). */
export function buscarCliente(numeroDocumento: string): Promise<ClienteResponse> {
  return api.get<ClienteResponse>(
    `/api/v1/retail/clientes?tipoDocumento=DNI&numeroDocumento=${numeroDocumento}`,
  )
}

/** Responde `409` si el documento ya existe, para ofrecer vincular al cliente que ya estaba. */
export function registrarCliente(datos: ClienteAltaRapidaRequest): Promise<ClienteResponse> {
  return api.post<ClienteResponse>('/api/v1/retail/clientes', datos)
}

/** Deja la respuesta del backend en la forma corta que muestra el mostrador. */
export function aClienteVenta(cliente: ClienteResponse): ClienteVenta {
  return {
    id: cliente.clienteId,
    tipoDocumento: cliente.tipoDocumento,
    numeroDocumento: cliente.numeroDocumento,
    nombre: cliente.nombreCompleto,
  }
}
