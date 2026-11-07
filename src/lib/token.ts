/**
 * Vigencia del token de sesión, leída en el navegador sin verificar su firma.
 *
 * Verificar la firma es trabajo del backend, que es quien tiene la clave. Aquí la vigencia solo se
 * usa para decisiones de interfaz: si el token ya venció, no tiene sentido dejar entrar a una
 * pantalla cuya primera llamada al servidor va a fallar con 401.
 */

/**
 * Indica si el token sigue vigente según su claim `exp` (segundos desde epoch, RFC 7519).
 *
 * - Un token que no se puede leer como JWT no es vigente: es basura y no identifica a nadie.
 * - Un JWT sin `exp` se considera vigente: aquí no hay forma de saber si caducó, y decidirlo es
 *   trabajo del backend en la primera petición.
 */
export function tokenVigente(token: string, ahoraMs: number = Date.now()): boolean {
  const claims = leerClaims(token)
  if (claims === null) return false
  if (typeof claims.exp !== 'number') return true
  return claims.exp * 1000 > ahoraMs
}

function leerClaims(token: string): { exp?: unknown } | null {
  const partes = token.split('.')
  if (partes.length !== 3 || !partes[1]) return null
  try {
    const json = atob(partes[1].replace(/-/g, '+').replace(/_/g, '/'))
    const claims: unknown = JSON.parse(json)
    return typeof claims === 'object' && claims !== null ? (claims as { exp?: unknown }) : null
  } catch {
    return null
  }
}
