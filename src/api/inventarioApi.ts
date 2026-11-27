/**
 * Incidencias de inventario y cuarentena en tienda (F12 · RF-32, RF-33).
 *
 * Rutas del contrato (`api-contracts.md` §5.12):
 * - `POST /api/v1/retail/inventario/incidencias` 🔁 (exige `Idempotency-Key`)
 * - `GET /api/v1/retail/inventario/cuarentena`
 *
 * La tienda sale del perfil del vendedor. Con `VITE_USE_MOCKS=true` las incidencias viven en memoria
 * y Inventory (G6) "acepta" cada reporte a los pocos segundos, como haría el outbox real.
 */
import { products as catalogoSemilla } from '../data/products'
import { ApiError, api, USA_MOCKS } from './http'

export type TipoFalla = 'MANCHADO_PROBADOR' | 'COSTURA_ROTA' | 'EXTRAVIO_NO_UBICADO' | 'DEFECTO_FABRICA'

/** `PENDIENTE_REPORTE` y `EN_CUARENTENA` son la cuarentena activa: bloquean la venta. */
export type EstadoIncidencia = 'PENDIENTE_REPORTE' | 'EN_CUARENTENA' | 'DERIVADO_ALMACEN' | 'BAJA_DEFINITIVA'

/** Motivos que ve el vendedor, en el orden en que se ofrecen (spec F12, RF-32). */
export const TIPOS_FALLA: { valor: TipoFalla; etiqueta: string }[] = [
  { valor: 'MANCHADO_PROBADOR', etiqueta: 'Prenda manchada en probador' },
  { valor: 'COSTURA_ROTA', etiqueta: 'Costura o tela dañada' },
  { valor: 'DEFECTO_FABRICA', etiqueta: 'Falla de confección' },
  { valor: 'EXTRAVIO_NO_UBICADO', etiqueta: 'Artículo extraviado / no ubicado' },
]

export const etiquetaFalla = (tipo: TipoFalla) => TIPOS_FALLA.find((t) => t.valor === tipo)?.etiqueta ?? tipo

/** Mínimo de la observación (RF-32). El backend lo valida igual sin contar espacios. */
export const MIN_OBSERVACION = 5

export interface RegistroIncidencia {
  sku: string
  codigoBarras?: string
  tipoFalla: TipoFalla
  detalleObservacion: string
  evidenciaFotoUrl?: string
}

export interface IncidenciaRegistrada {
  incidenciaId: string
  estado: EstadoIncidencia
  sku: string
}

export interface ItemCuarentena {
  incidenciaId: string
  sku: string
  nombreProducto: string | null
  tipoFalla: TipoFalla
  fechaReporte: string
  estado: EstadoIncidencia
}

/** Código con el que el backend rechaza una prenda bloqueada en el carrito o el cambio (§5.4, §5.9). */
export const SKU_EN_CUARENTENA = 'SKU_EN_CUARENTENA'

export const esErrorCuarentena = (error: unknown) => error instanceof ApiError && error.codigo === SKU_EN_CUARENTENA

/**
 * RF-32: reporta la prenda. La `idempotencyKey` debe ser la misma en los reintentos del mismo
 * reporte, para que un doble clic o un corte de red no registre dos incidencias.
 */
export function reportarIncidencia(datos: RegistroIncidencia, idempotencyKey: string): Promise<IncidenciaRegistrada> {
  if (USA_MOCKS) return simular(() => registrarSimulada(datos, idempotencyKey))
  return api.post<IncidenciaRegistrada>('/api/v1/retail/inventario/incidencias', datos, {
    'Idempotency-Key': idempotencyKey,
  })
}

/** RF-33: prendas en cuarentena activa de la tienda, las más recientes primero. */
export function listarCuarentena(): Promise<ItemCuarentena[]> {
  if (USA_MOCKS) return simular(() => [...simuladas.values()].map((s) => s.item).reverse())
  return api.get<ItemCuarentena[]>('/api/v1/retail/inventario/cuarentena')
}

// ---------------------------------------------------------------------------------------------
// Doble en memoria para la demo (VITE_USE_MOCKS=true)
// ---------------------------------------------------------------------------------------------

/** Lo que tarda el "outbox" simulado en que Inventory acepte el reporte. */
export const ACEPTACION_SIMULADA_MS = 4000

const simuladas = new Map<string, { item: ItemCuarentena; datos: RegistroIncidencia }>()

function nombreSemilla(sku: string): string | null {
  for (const producto of catalogoSemilla) {
    const variante = producto.variants?.find((v) => v.sku === sku)
    if (variante) return `${producto.name} (${variante.size} / ${variante.color})`
    if (producto.id === sku) return producto.name
  }
  return null
}

function registrarSimulada(datos: RegistroIncidencia, clave: string): IncidenciaRegistrada {
  const previa = simuladas.get(clave)
  if (previa) {
    if (previa.datos.sku !== datos.sku || previa.datos.tipoFalla !== datos.tipoFalla) {
      throw new ApiError(409, { code: 'IDEMPOTENCY_CONFLICT', detail: 'La clave ya se usó para otra incidencia' })
    }
    return { incidenciaId: previa.item.incidenciaId, estado: previa.item.estado, sku: previa.item.sku }
  }
  const item: ItemCuarentena = {
    incidenciaId: crypto.randomUUID(),
    sku: datos.sku,
    nombreProducto: nombreSemilla(datos.sku),
    tipoFalla: datos.tipoFalla,
    fechaReporte: new Date().toISOString(),
    estado: 'PENDIENTE_REPORTE',
  }
  simuladas.set(clave, { item, datos })
  setTimeout(() => {
    item.estado = 'EN_CUARENTENA'
  }, ACEPTACION_SIMULADA_MS)
  return { incidenciaId: item.incidenciaId, estado: item.estado, sku: item.sku }
}

/** Solo para pruebas: vacía las incidencias simuladas. */
export function reiniciarSimulacion(): void {
  simuladas.clear()
}

const simular = <T,>(datos: () => T) =>
  new Promise<T>((resolver, rechazar) =>
    setTimeout(() => {
      try {
        resolver(datos())
      } catch (error) {
        rechazar(error)
      }
    }, 250),
  )
