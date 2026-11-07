import type { VentaOfflineRegistro, EstadoVentaOffline } from '../types/contingencia'
import type { Product } from '../types'

const DB_NAME = 'RetailOfflineDB'
const DB_VERSION = 1
const STORE_VENTAS = 'ventas_offline'
const STORE_CATALOGO = 'catalogo_cache'

// Fallback en memoria si IndexedDB no está disponible (ej. entorno de tests jsdom)
const fallbackVentas = new Map<string, VentaOfflineRegistro>()
let fallbackCatalogo: Product[] | null = null

function tieneIndexedDB(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined'
}

function abrirBD(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!tieneIndexedDB()) {
      return reject(new Error('IndexedDB no está disponible en este entorno'))
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_VENTAS)) {
        const store = db.createObjectStore(STORE_VENTAS, { keyPath: 'ventaLocalUuid' })
        store.createIndex('estado', 'estado', { unique: false })
        store.createIndex('fechaHoraOffline', 'fechaHoraOffline', { unique: false })
        store.createIndex('turnoId', 'turnoId', { unique: false })
      }
      if (!db.objectStoreNames.contains(STORE_CATALOGO)) {
        db.createObjectStore(STORE_CATALOGO, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Guarda una venta en contingencia offline de forma duradera (RF-27 / CA-10-02). */
export async function guardarVentaOffline(venta: VentaOfflineRegistro): Promise<void> {
  if (!tieneIndexedDB()) {
    fallbackVentas.set(venta.ventaLocalUuid, venta)
    return
  }

  const db = await abrirBD()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VENTAS, 'readwrite')
    const store = tx.objectStore(STORE_VENTAS)
    const req = store.put(venta)

    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/** Obtiene todas las ventas en cola con estado PENDIENTE en orden FIFO. */
export async function obtenerVentasPendientes(): Promise<VentaOfflineRegistro[]> {
  if (!tieneIndexedDB()) {
    const pendientes = Array.from(fallbackVentas.values()).filter((v) => v.estado === 'PENDIENTE')
    pendientes.sort(
      (a, b) => new Date(a.fechaHoraOffline).getTime() - new Date(b.fechaHoraOffline).getTime()
    )
    return pendientes
  }

  const db = await abrirBD()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VENTAS, 'readonly')
    const store = tx.objectStore(STORE_VENTAS)
    const req = store.getAll()

    req.onsuccess = () => {
      const todos: VentaOfflineRegistro[] = req.result || []
      const pendientes = todos.filter((v) => v.estado === 'PENDIENTE')
      // Orden FIFO por fecha
      pendientes.sort(
        (a, b) => new Date(a.fechaHoraOffline).getTime() - new Date(b.fechaHoraOffline).getTime()
      )
      resolve(pendientes)
    }
    req.onerror = () => reject(req.error)
  })
}

/** Actualiza el estado de conciliación de una venta sincronizada. */
export async function actualizarEstadoVentaOffline(
  uuid: string,
  estado: EstadoVentaOffline,
  pedidoId?: string | null,
  comprobante?: string | null,
  error?: string | null
): Promise<void> {
  if (!tieneIndexedDB()) {
    const actual = fallbackVentas.get(uuid)
    if (actual) {
      fallbackVentas.set(uuid, {
        ...actual,
        estado,
        pedidoId: pedidoId ?? actual.pedidoId,
        comprobante: comprobante ?? actual.comprobante,
        error: error ?? actual.error,
      })
    }
    return
  }

  const db = await abrirBD()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VENTAS, 'readwrite')
    const store = tx.objectStore(STORE_VENTAS)
    const getReq = store.get(uuid)

    getReq.onsuccess = () => {
      const venta: VentaOfflineRegistro = getReq.result
      if (!venta) {
        return resolve()
      }
      venta.estado = estado
      if (pedidoId !== undefined) venta.pedidoId = pedidoId
      if (comprobante !== undefined) venta.comprobante = comprobante
      if (error !== undefined) venta.error = error

      const putReq = store.put(venta)
      putReq.onsuccess = () => resolve()
      putReq.onerror = () => reject(putReq.error)
    }
    getReq.onerror = () => reject(getReq.error)
  })
}

/** Retorna la cantidad de ventas offline que aún están pendientes de envío. */
export async function contarVentasPendientes(): Promise<number> {
  const pendientes = await obtenerVentasPendientes()
  return pendientes.length
}

/** Guarda la última copia local del catálogo para operar durante contingencia (CA-10-03). */
export async function guardarCatalogoCache(productos: Product[]): Promise<void> {
  if (!tieneIndexedDB()) {
    fallbackCatalogo = productos
    try {
      localStorage.setItem('f10_catalogo_cache', JSON.stringify(productos))
    } catch {
      // cuota excedida en localStorage
    }
    return
  }

  const db = await abrirBD()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CATALOGO, 'readwrite')
    const store = tx.objectStore(STORE_CATALOGO)
    store.clear()
    for (const p of productos) {
      store.put(p)
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Recupera el catálogo en caché local cuando no hay conexión. */
export async function obtenerCatalogoCache(): Promise<Product[] | null> {
  if (!tieneIndexedDB()) {
    if (fallbackCatalogo) return fallbackCatalogo
    const stored = localStorage.getItem('f10_catalogo_cache')
    return stored ? JSON.parse(stored) : null
  }

  try {
    const db = await abrirBD()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CATALOGO, 'readonly')
      const store = tx.objectStore(STORE_CATALOGO)
      const req = store.getAll()
      req.onsuccess = () => {
        resolve(req.result && req.result.length > 0 ? req.result : null)
      }
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

/** Limpia las ventas offline (para pruebas unitarias). */
export function _resetFallbackStorage(): void {
  fallbackVentas.clear()
  fallbackCatalogo = null
  try {
    localStorage.removeItem('f10_catalogo_cache')
  } catch {
    // noop
  }
}

