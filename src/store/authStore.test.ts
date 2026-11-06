// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from './authStore'
import { obtenerPerfil, type Perfil } from '../api/seguridad'

vi.mock('../api/seguridad', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/seguridad')>()),
  obtenerPerfil: vi.fn(),
}))

const CLAVE_TOKEN = 'retail.token'

const PERFIL: Perfil = {
  usuarioId: 'bbbbbbbb-0000-0000-0000-000000000001',
  codigoVendedor: 'VEN-001',
  perfilTienda: 'VENDEDOR',
  tiendaId: 'TIENDA-MIRAFLORES',
  activo: true,
}

function tokenQueVenceEn(segundos: number): string {
  const b64url = (valor: unknown) =>
    btoa(JSON.stringify(valor)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const exp = Math.floor(Date.now() / 1000) + segundos
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: PERFIL.usuarioId, exp })}.firma`
}

const estadoInicial = useAuthStore.getState()

afterEach(() => {
  useAuthStore.setState(estadoInicial, true)
  window.localStorage.clear()
  vi.mocked(obtenerPerfil).mockReset()
})

describe('authStore.restaurarSesion (sesión que sobrevive a una recarga)', () => {
  it('restaura la sesión de un token guardado que sigue vigente', async () => {
    window.localStorage.setItem(CLAVE_TOKEN, tokenQueVenceEn(3600))
    vi.mocked(obtenerPerfil).mockResolvedValue(PERFIL)

    await useAuthStore.getState().restaurarSesion()

    expect(useAuthStore.getState().autenticado()).toBe(true)
    expect(useAuthStore.getState().perfil?.codigoVendedor).toBe('VEN-001')
    expect(useAuthStore.getState().restaurando).toBe(false)
  })

  it('no consulta al backend si el token guardado ya venció, y lo descarta', async () => {
    window.localStorage.setItem(CLAVE_TOKEN, tokenQueVenceEn(-60))

    await useAuthStore.getState().restaurarSesion()

    expect(obtenerPerfil).not.toHaveBeenCalled()
    expect(useAuthStore.getState().autenticado()).toBe(false)
    expect(window.localStorage.getItem(CLAVE_TOKEN)).toBeNull()
    expect(useAuthStore.getState().restaurando).toBe(false)
  })

  it('limpia la sesión si el backend rechaza el token guardado', async () => {
    window.localStorage.setItem(CLAVE_TOKEN, tokenQueVenceEn(3600))
    vi.mocked(obtenerPerfil).mockRejectedValue(new Error('401'))

    await useAuthStore.getState().restaurarSesion()

    expect(useAuthStore.getState().autenticado()).toBe(false)
    expect(window.localStorage.getItem(CLAVE_TOKEN)).toBeNull()
    expect(useAuthStore.getState().restaurando).toBe(false)
  })

  it('termina de inmediato cuando no hay sesión guardada', async () => {
    useAuthStore.setState({ restaurando: true })

    await useAuthStore.getState().restaurarSesion()

    expect(obtenerPerfil).not.toHaveBeenCalled()
    expect(useAuthStore.getState().restaurando).toBe(false)
  })
})
