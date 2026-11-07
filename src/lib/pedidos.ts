/**
 * Reglas de presentación de la consulta histórica de pedidos (F6 · RF-16, RF-17).
 *
 * Funciones puras: se prueban sin renderizar React.
 */
import { products } from '../data/products'
import type { EventoEstado } from '../api/pedidoApi'

/** DNI de 8 dígitos o RUC de 11, igual que el contrato (§5.6). */
export const esDocumentoValido = (documento: string) => /^(\d{8}|\d{11})$/.test(documento.trim())

const ETIQUETAS_ESTADO: Record<string, string> = {
  CREADO: 'Creado',
  PAGADO: 'Pagado',
  EN_PREPARACION: 'En preparación',
  DESPACHADO: 'Despachado',
  ENTREGADO: 'Entregado',
  ANULADO: 'Anulado',
}

export const etiquetaEstado = (estado: string) => ETIQUETAS_ESTADO[estado] ?? estado

export type TonoEstado = 'success' | 'info' | 'warning' | 'error' | 'brand' | 'neutral'

/** Color semántico del Design System: verde entregado, azul despachado, ámbar en preparación, rojo anulado. */
export function tonoEstado(estado: string): TonoEstado {
  switch (estado) {
    case 'ENTREGADO':
      return 'success'
    case 'DESPACHADO':
      return 'info'
    case 'EN_PREPARACION':
      return 'warning'
    case 'ANULADO':
      return 'error'
    case 'PAGADO':
      return 'brand'
    default:
      return 'neutral'
  }
}

const ETIQUETAS_CANAL: Record<string, string> = {
  RETAIL: 'Tienda física',
  MARKETPLACE: 'Web',
  CHATBOT: 'Chatbot',
}

export const etiquetaCanal = (canal: string) => ETIQUETAS_CANAL[canal] ?? canal

/** Pedido que el cliente recoge en tienda (Ventas usa `RECOJO_TIENDA`; el contrato, `PICKUP`). */
export const esPickup = (modalidad?: string) => modalidad === 'RECOJO_TIENDA' || modalidad === 'PICKUP'

const formatoLima = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** `DD/MM/YYYY HH:mm` en hora de Perú, sin importar la zona del navegador. */
export function formatFechaHoraLima(iso?: string): string {
  if (!iso) return '—'
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return iso
  const partes = Object.fromEntries(formatoLima.formatToParts(fecha).map((p) => [p.type, p.value]))
  return `${partes.day}/${partes.month}/${partes.year} ${partes.hour}:${partes.minute}`
}

/** Recorrido normal de un pedido en Ventas (G5). */
export const FLUJO_PEDIDO = ['CREADO', 'PAGADO', 'EN_PREPARACION', 'DESPACHADO', 'ENTREGADO'] as const

export type EstadoPaso = 'completado' | 'actual' | 'pendiente' | 'anulado'

export interface PasoLinea {
  estado: string
  situacion: EstadoPaso
  fecha?: string
  motivo?: string
}

/**
 * Nodos de la línea de tiempo (RF-17).
 *
 * Los estados ya ocurridos van completados con su fecha; el estado actual se resalta y los que
 * faltan quedan pendientes. Un estado del flujo que el pedido se saltó (una venta de mostrador nace
 * `PAGADO`) no se dibuja. Si el pedido se anuló, la línea se corta en un nodo rojo de cancelación.
 */
export function pasosLineaTiempo(historial: EventoEstado[], estadoActual: string): PasoLinea[] {
  const ocurrido = new Map<string, EventoEstado>()
  historial.forEach((evento) => ocurrido.set(evento.estado, evento))
  const conFecha = (estado: string) => ocurrido.get(estado)?.fecha

  if (estadoActual === 'ANULADO') {
    const previos: PasoLinea[] = historial
      .filter((evento) => evento.estado !== 'ANULADO')
      .map((evento) => ({ estado: evento.estado, situacion: 'completado', fecha: evento.fecha }))
    const anulacion = ocurrido.get('ANULADO')
    return [...previos, { estado: 'ANULADO', situacion: 'anulado', fecha: anulacion?.fecha, motivo: anulacion?.motivo }]
  }

  const indiceActual = FLUJO_PEDIDO.indexOf(estadoActual as (typeof FLUJO_PEDIDO)[number])
  if (indiceActual === -1) {
    // Estado que el flujo no conoce: se muestra el historial tal cual, con el último como actual.
    return historial.map((evento, i) => ({
      estado: evento.estado,
      situacion: i === historial.length - 1 ? 'actual' : 'completado',
      fecha: evento.fecha,
    }))
  }

  const pasos: PasoLinea[] = []
  FLUJO_PEDIDO.forEach((estado, i) => {
    if (i < indiceActual) {
      if (ocurrido.has(estado)) pasos.push({ estado, situacion: 'completado', fecha: conFecha(estado) })
    } else if (i === indiceActual) {
      // ENTREGADO es el final del recorrido: ya no está "en curso".
      pasos.push({ estado, situacion: estado === 'ENTREGADO' ? 'completado' : 'actual', fecha: conFecha(estado) })
    } else {
      pasos.push({ estado, situacion: 'pendiente' })
    }
  })
  return pasos
}

export interface PrendaCatalogo {
  imagen?: string
  talla?: string
  color?: string
}

/** Foto, talla y color de la prenda según el catálogo de la tienda, por su SKU. */
export function prendaDelCatalogo(sku: string): PrendaCatalogo {
  for (const producto of products) {
    const variante = producto.variants?.find((v) => v.sku === sku)
    if (variante) return { imagen: producto.image, talla: variante.size, color: variante.color }
    if (producto.id === sku) return { imagen: producto.image }
  }
  return {}
}
