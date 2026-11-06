// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import { useAuthStore } from '../store/authStore'
import type { Perfil } from '../api/seguridad'

const PERFIL: Perfil = {
  usuarioId: 'bbbbbbbb-0000-0000-0000-000000000001',
  codigoVendedor: 'VEN-001',
  perfilTienda: 'VENDEDOR',
  tiendaId: 'TIENDA-MIRAFLORES',
  activo: true,
}

/** JWT de prueba que vence dentro de `segundos` (negativo: ya venció). La firma no importa aquí. */
function tokenQueVenceEn(segundos: number): string {
  const b64url = (valor: unknown) =>
    btoa(JSON.stringify(valor)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const exp = Math.floor(Date.now() / 1000) + segundos
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: PERFIL.usuarioId, exp })}.firma`
}

const estadoInicial = useAuthStore.getState()

afterEach(() => {
  cleanup()
  useAuthStore.setState(estadoInicial, true)
  window.localStorage.clear()
})

/** Monta la app en `ruta`, con una pantalla de login pública y una bandeja protegida. */
function abrir(ruta: string) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/login" element={<p>Pantalla de login</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/pickup" element={<p>Bandeja de pickup</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute (seguridad en pantallas)', () => {
  it('redirige al login cuando se entra directo a una pantalla sin sesión', () => {
    useAuthStore.setState({ token: null, perfil: null, restaurando: false })

    abrir('/pickup')

    expect(screen.getByText('Pantalla de login')).toBeTruthy()
    expect(screen.queryByText('Bandeja de pickup')).toBeNull()
  })

  it('muestra la pantalla cuando la sesión está activa', () => {
    useAuthStore.setState({ token: tokenQueVenceEn(3600), perfil: PERFIL, restaurando: false })

    abrir('/pickup')

    expect(screen.getByText('Bandeja de pickup')).toBeTruthy()
  })

  it('redirige al login si el token ya venció, aunque quede un perfil en memoria', () => {
    useAuthStore.setState({ token: tokenQueVenceEn(-60), perfil: PERFIL, restaurando: false })

    abrir('/pickup')

    expect(screen.getByText('Pantalla de login')).toBeTruthy()
  })

  it('espera mientras se restaura una sesión guardada, en vez de mandar al login', () => {
    useAuthStore.setState({ token: null, perfil: null, restaurando: true })

    abrir('/pickup')

    expect(screen.getByRole('status').textContent).toContain('Verificando sesión')
    expect(screen.queryByText('Pantalla de login')).toBeNull()
  })

  it('devuelve al login apenas el vendedor cierra sesión desde una pantalla protegida', () => {
    useAuthStore.setState({ token: tokenQueVenceEn(3600), perfil: PERFIL, restaurando: false })
    abrir('/pickup')
    expect(screen.getByText('Bandeja de pickup')).toBeTruthy()

    act(() => useAuthStore.getState().salir())

    expect(screen.getByText('Pantalla de login')).toBeTruthy()
  })
})
