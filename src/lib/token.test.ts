import { describe, expect, it } from 'vitest'
import { tokenVigente } from './token'

const AHORA_MS = Date.UTC(2026, 10, 7, 10, 0, 0)
const AHORA_S = AHORA_MS / 1000

/** Arma un JWT de prueba con las claims indicadas. La firma no importa: aquí no se verifica. */
function jwt(claims: Record<string, unknown>): string {
  const b64url = (valor: unknown) =>
    btoa(JSON.stringify(valor)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(claims)}.firma`
}

describe('tokenVigente (seguridad en pantallas)', () => {
  it('acepta un token que todavía no vence', () => {
    expect(tokenVigente(jwt({ sub: 'VEN-001', exp: AHORA_S + 3600 }), AHORA_MS)).toBe(true)
  })

  it('rechaza un token vencido', () => {
    expect(tokenVigente(jwt({ sub: 'VEN-001', exp: AHORA_S - 1 }), AHORA_MS)).toBe(false)
  })

  it('rechaza un token que vence exactamente ahora', () => {
    expect(tokenVigente(jwt({ sub: 'VEN-001', exp: AHORA_S }), AHORA_MS)).toBe(false)
  })

  it('deja decidir al backend cuando el token no trae exp', () => {
    expect(tokenVigente(jwt({ sub: 'VEN-001' }), AHORA_MS)).toBe(true)
  })

  it('rechaza lo que no es un JWT', () => {
    expect(tokenVigente('no-es-un-token', AHORA_MS)).toBe(false)
    expect(tokenVigente('a.b', AHORA_MS)).toBe(false)
    expect(tokenVigente('cabecera.@@@contenido-roto@@@.firma', AHORA_MS)).toBe(false)
  })
})
