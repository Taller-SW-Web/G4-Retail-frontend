// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { consultarSalud } from '../../api/http'
import OfflineBanner from './OfflineBanner'

vi.mock('../../api/http', () => ({ USA_MOCKS: false, consultarSalud: vi.fn() }))

const sondeo = vi.mocked(consultarSalud)

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
  sondeo.mockReset().mockResolvedValue(true)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('Detección de conexión en el POS (RF-26)', () => {
  it('avisa inmediatamente al desconectarse y verifica Retail al volver la red', async () => {
    await act(async () => { render(<OfflineBanner />) })
    expect(screen.queryByRole('status')).toBeNull()

    act(() => { window.dispatchEvent(new Event('offline')) })
    expect(screen.getByRole('status').textContent).toContain('Sin conexión con Retail')

    await act(async () => { window.dispatchEvent(new Event('online')) })
    expect(sondeo).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('avisa tras dos fallos consecutivos del heartbeat', async () => {
    sondeo.mockResolvedValue(false)
    await act(async () => { render(<OfflineBanner />) })
    expect(screen.queryByRole('status')).toBeNull()

    await act(async () => { await vi.advanceTimersByTimeAsync(15_000) })
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('aborta un heartbeat sin respuesta y avisa al llegar a tres segundos', async () => {
    sondeo.mockImplementation((signal) => new Promise((_, rechazar) => {
      signal.addEventListener('abort', () => rechazar(signal.reason), { once: true })
    }))
    await act(async () => { render(<OfflineBanner />) })

    await act(async () => { await vi.advanceTimersByTimeAsync(3_000) })
    expect(sondeo.mock.calls[0]?.[0].aborted).toBe(true)
    expect(screen.getByRole('status')).toBeTruthy()
  })
})
