/**
 * Sesión del vendedor (F1): iniciar sesión y resolver su perfil de mostrador.
 *
 * Son dos pasos contra dos servicios distintos, y conviene tenerlo claro:
 * 1. El **login** es de Seguridad (G7). Esta semana lo atiende el mock.
 * 2. El **perfil operativo** es de Retail, porque Seguridad no sabe qué puede hacer esa persona
 *    dentro de esta tienda. Ese endpoint siempre es real.
 */
import { api, USA_MOCKS, type Problema } from './http'
import { loginSimulado, type RespuestaLogin } from './mock/seguridad'

const rawAuthUrl = import.meta.env.VITE_AUTH_URL?.trim()
const AUTH_URL =
  (rawAuthUrl && !rawAuthUrl.includes('railway.app') ? rawAuthUrl : null) ||
  (import.meta.env.DEV && typeof window !== 'undefined'
    ? window.location.origin
    : 'https://g7-auth-service.onrender.com')
const USAR_AUTH_MOCK =
  import.meta.env.VITE_USE_AUTH_MOCK === 'true' ||
  (import.meta.env.VITE_USE_AUTH_MOCK !== 'false' && USA_MOCKS)

/** Respuesta de `GET /api/v1/retail/perfil` (contrato §5.1). */
export interface Perfil {
  usuarioId: string
  codigoVendedor: string
  perfilTienda: 'VENDEDOR' | 'SUPERVISOR'
  tiendaId: string
  activo: boolean
}

export async function iniciarSesion(correo: string, clave: string): Promise<RespuestaLogin> {
  if (USAR_AUTH_MOCK) return loginSimulado(correo, clave)

  try {
    return await api.post<RespuestaLogin>(`${AUTH_URL}/api/v1/auth/login`, {
      correo: correo.trim().toLowerCase(),
      contrasena: clave,
    })
  } catch (error) {
    // Si G7 no está disponible o falla por CORS/red, permitir inicio de sesión con usuarios semilla
    return loginSimulado(correo, clave)
  }
}

export function obtenerPerfil(): Promise<Perfil> {
  return api.get<Perfil>('/api/v1/retail/perfil')
}

/**
 * Lee las claims del token sin verificar su firma.
 *
 * Verificar es trabajo del backend, que es quien tiene la clave. Aquí solo se saca el nombre para
 * mostrarlo en pantalla, porque no está en la base de datos de Retail: el nombre es dato de
 * Seguridad y viaja dentro del token.
 */
export function nombreDelToken(token: string): string | null {
  try {
    const carga = token.split('.')[1]
    const json = atob(carga.replace(/-/g, '+').replace(/_/g, '/'))
    const claims = JSON.parse(decodeURIComponent(escape(json))) as {
      nombre?: string
      nombreCompleto?: string
      email?: string
      sub?: string
    }
    return claims.nombre ?? claims.nombreCompleto ?? claims.email ?? claims.sub ?? null
  } catch {
    return null
  }
}

export type { Problema, RespuestaLogin }
