import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./http', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./http')>()),
  USA_MOCKS: false,
  api: { post: vi.fn(), get: vi.fn() },
}))

import { api, ApiError } from './http'
import { iniciarSesion } from './seguridad'

afterEach(() => vi.mocked(api.post).mockReset())

/**
 * F1 · RF-01: con Seguridad (G7) real, solo G7 autentica. Si G7 rechaza las credenciales o no
 * responde, el POS no debe abrir sesión con los usuarios semilla de desarrollo.
 */
describe('iniciarSesion contra Seguridad (G7)', () => {
  it('envía el correo normalizado y la contraseña a POST /api/v1/auth/login', async () => {
    vi.mocked(api.post).mockResolvedValue({ accessToken: 'token-g7', tokenType: 'Bearer', expiresIn: 900 })

    const sesion = await iniciarSesion('  Vendedor@Tienda.PE ', 'clave')

    expect(sesion.accessToken).toBe('token-g7')
    expect(vi.mocked(api.post).mock.calls[0][0]).toMatch(/\/api\/v1\/auth\/login$/)
    expect(vi.mocked(api.post).mock.calls[0][1]).toEqual({ correo: 'vendedor@tienda.pe', contrasena: 'clave' })
  })

  it('si G7 rechaza las credenciales, propaga el 401', async () => {
    vi.mocked(api.post).mockRejectedValue(new ApiError(401, { code: 'CREDENCIALES_INVALIDAS' }))

    await expect(iniciarSesion('vendedor@tienda.pe', 'mala')).rejects.toMatchObject({ status: 401 })
  })

  it('si G7 no responde, no entra con un usuario semilla', async () => {
    vi.mocked(api.post).mockRejectedValue(new ApiError(0, { code: 'SIN_CONEXION' }))

    await expect(iniciarSesion('vendedor1@inkaathletics.pe', 'Retail2026!')).rejects.toMatchObject({ status: 0 })
  })
})
