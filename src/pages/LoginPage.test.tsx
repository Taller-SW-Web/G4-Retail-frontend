// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

afterEach(() => {
  cleanup()
  vi.resetModules()
  vi.doUnmock('../api/seguridad')
})

async function pantallaDeLogin(loginSimulado: boolean) {
  vi.doMock('../api/seguridad', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../api/seguridad')>()),
    USAR_AUTH_MOCK: loginSimulado,
  }))
  const { default: LoginPage } = await import('./LoginPage')
  render(<LoginPage onLogin={vi.fn()} />)
}

const campo = (nombre: RegExp) => screen.getByLabelText(nombre) as HTMLInputElement

describe('LoginPage (F1 · RF-01)', () => {
  it('con Seguridad real el formulario empieza vacío, sin credenciales de prueba', async () => {
    await pantallaDeLogin(false)

    expect(campo(/correo/i).value).toBe('')
    expect(campo(/contraseña/i).value).toBe('')
  })

  it('en el modo simulado precarga la cuenta semilla para la demo local', async () => {
    await pantallaDeLogin(true)

    expect(campo(/correo/i).value).toBe('vendedor1@inkaathletics.pe')
    expect(campo(/contraseña/i).value).not.toBe('')
  })
})
