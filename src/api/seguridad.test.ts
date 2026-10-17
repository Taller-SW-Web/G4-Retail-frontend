import { describe, it, expect } from 'vitest'
import { nombreDelToken, iniciarSesion } from './seguridad'

describe('Seguridad API (F1)', () => {
  describe('nombreDelToken', () => {
    it('extrae el nombre cuando la claim nombre está presente', () => {
      // {"sub":"123","nombre":"Lucia Ramirez"}
      const token = 'header.eyJzdWIiOiIxMjMiLCJub21icmUiOiJMdWNpYSBSYW1pcmV6In0.signature'
      expect(nombreDelToken(token)).toBe('Lucia Ramirez')
    })

    it('extrae el email si la claim nombre no está presente', () => {
      // {"sub":"123","email":"miguel.solis@unmsm.edu.pe"}
      const token = 'header.eyJzdWIiOiIxMjMiLCJlbWFpbCI6Im1pZ3VlbC5zb2xpc0B1bm1zbS5lZHUucGUifQ.signature'
      expect(nombreDelToken(token)).toBe('miguel.solis@unmsm.edu.pe')
    })

    it('devuelve sub si no hay nombre ni email', () => {
      // {"sub":"b9e222a5-cf86-4c95-9611-891886160821"}
      const token = 'header.eyJzdWIiOiJiOWUyMjJhNS1jZjg2LTRjOTUtOTYxMS04OTE4ODYxNjA4MjEifQ.signature'
      expect(nombreDelToken(token)).toBe('b9e222a5-cf86-4c95-9611-891886160821')
    })

    it('retorna null si el token es inválido o corrupto', () => {
      expect(nombreDelToken('no-es-un-jwt')).toBeNull()
      expect(nombreDelToken('')).toBeNull()
    })
  })

  describe('iniciarSesion con mocks', () => {
    it('autentica satisfactoriamente con usuario semilla en modo mock', async () => {
      const res = await iniciarSesion('vendedor1@inkaathletics.pe', 'Retail2026!')
      expect(res.accessToken).toBeDefined()
      expect(res.tokenType).toBe('Bearer')
    })

    it('rechaza credenciales incorrectas en modo mock', async () => {
      await expect(iniciarSesion('vendedor1@inkaathletics.pe', 'erronea')).rejects.toThrow()
    })
  })
})
