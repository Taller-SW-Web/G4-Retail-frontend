/**
 * Cliente HTTP único de la aplicación.
 *
 * Todas las funcionalidades hablan con el backend a través de aquí, para que la inyección del
 * token, el formato de errores y la expiración de sesión se resuelvan en un solo lugar y no se
 * repitan siete veces.
 */

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

/** Con `VITE_USE_MOCKS=false` la app llama a los servicios reales. Por defecto, simula. */
export const USA_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false'

/** Cuerpo de error que devuelve el backend: `application/problem+json` (RFC 7807). */
export interface Problema {
  type?: string
  title?: string
  status?: number
  code?: string
  detail?: string
  instance?: string
  correlationId?: string
  errores?: { campo: string; motivo: string }[]
}

/**
 * Error de la API.
 *
 * Se decide por `status` y `codigo`, nunca por el texto de `message`, que puede cambiar sin aviso.
 */
export class ApiError extends Error {
  readonly status: number
  readonly problema: Problema

  constructor(status: number, problema: Problema = {}) {
    super(problema.detail ?? problema.title ?? `Error HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.problema = problema
  }

  get codigo(): string {
    return this.problema.code ?? 'ERROR_DESCONOCIDO'
  }

  /** `status` 0 significa que no hubo respuesta: servidor caído o sin red. */
  get sinConexion(): boolean {
    return this.status === 0
  }
}

let tokenActual: string | null = null
let alPerderSesion: (() => void) | null = null

/** El store de sesión registra aquí el token; así este módulo no depende de él y no hay ciclo. */
export function definirToken(token: string | null): void {
  tokenActual = token
}

/** Se invoca cuando el backend responde 401, para que la app vuelva al login. */
export function registrarPerdidaDeSesion(accion: () => void): void {
  alPerderSesion = accion
}

async function peticion<T>(metodo: string, ruta: string, cuerpo?: unknown): Promise<T> {
  const esUrlAbsoluta = ruta.startsWith('http://') || ruta.startsWith('https://')
  const url = esUrlAbsoluta ? ruta : API_URL + ruta

  const cabeceras: Record<string, string> = {
    Accept: 'application/json',
  }
  if (!esUrlAbsoluta) {
    cabeceras['X-Correlation-Id'] = crypto.randomUUID()
  }
  if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json'
  if (tokenActual && !esUrlAbsoluta) cabeceras.Authorization = `Bearer ${tokenActual}`

  let respuesta: Response
  try {
    respuesta = await fetch(url, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    })
  } catch {
    // fetch solo falla así cuando no hubo respuesta: el servidor no está o no hay red.
    throw new ApiError(0, {
      code: 'SIN_CONEXION',
      detail: 'No se pudo contactar al servidor. Revisa tu conexión.',
    })
  }

  if (respuesta.status === 401 && !esUrlAbsoluta) {
    definirToken(null)
    alPerderSesion?.()
  }

  if (!respuesta.ok) {
    throw new ApiError(respuesta.status, await leerProblema(respuesta))
  }

  if (respuesta.status === 204) return undefined as T
  return (await respuesta.json()) as T
}

async function leerProblema(respuesta: Response): Promise<Problema> {
  try {
    return (await respuesta.json()) as Problema
  } catch {
    // Un error de infraestructura (proxy, balanceador) puede no venir en JSON.
    return { status: respuesta.status, detail: respuesta.statusText }
  }
}

export const api = {
  get: <T>(ruta: string) => peticion<T>('GET', ruta),
  post: <T>(ruta: string, cuerpo?: unknown) => peticion<T>('POST', ruta, cuerpo),
  put: <T>(ruta: string, cuerpo?: unknown) => peticion<T>('PUT', ruta, cuerpo),
  delete: <T>(ruta: string) => peticion<T>('DELETE', ruta),
}
