import { useAuthStore } from '../store/auth'
import { mockRequest } from './mock/handlers'

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false'
const API_URL = import.meta.env.VITE_API_URL ?? ''

/** Cuerpo `application/problem+json` que devuelven los microservicios. */
export interface Problem {
  title?: string
  detail?: string
  [extra: string]: unknown
}

export class ApiError extends Error {
  status: number
  problem: Problem

  constructor(status: number, problem: Problem = {}) {
    super(problem.detail ?? problem.title ?? `Error HTTP ${status}`)
    this.status = status
    this.problem = problem
  }
}

/** Status 0: no hubo respuesta (servicio caído o sin red). */
export const esErrorDeRed = (e: unknown) => e instanceof ApiError && e.status === 0

type Metodo = 'GET' | 'POST' | 'DELETE'

async function enviar(metodo: Metodo, ruta: string, cuerpo: unknown, token: string | null) {
  if (USE_MOCKS) return mockRequest(metodo, ruta, cuerpo, token)
  try {
    const res = await fetch(API_URL + ruta, {
      method: metodo,
      headers: {
        ...(cuerpo !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    })
    const texto = await res.text()
    return { status: res.status, body: texto ? JSON.parse(texto) : undefined }
  } catch {
    throw new ApiError(0, { title: 'Servicio no disponible' })
  }
}

/** Cliente HTTP: adjunta el Bearer en cada llamada y cierra la sesión ante un 401 (RF-03). */
export async function http<T>(metodo: Metodo, ruta: string, cuerpo?: unknown): Promise<T> {
  const { token, expirarSesion } = useAuthStore.getState()
  const { status, body } = await enviar(metodo, ruta, cuerpo, token)
  if (status >= 200 && status < 300) return body as T
  if (status === 401 && token) expirarSesion()
  throw new ApiError(status, body as Problem)
}
