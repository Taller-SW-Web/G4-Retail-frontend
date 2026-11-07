import { useEffect, useState } from 'react'
import { consultarSalud, USA_MOCKS } from '../api/http'

const INTERVALO_MS = 15_000
const TIMEOUT_MS = 3_000

/** RF-26. Detecta desconexión local y fallos del heartbeat de Retail. */
export function useEstadoConexion(): boolean {
  const [enLinea, setEnLinea] = useState(() => navigator.onLine)

  useEffect(() => {
    let fallos = 0
    let cancelarSondeo: (() => void) | null = null

    async function sondear() {
      if (!navigator.onLine || cancelarSondeo) return

      const controlador = new AbortController()
      const temporizador = window.setTimeout(() => {
        controlador.abort()
        setEnLinea(false)
      }, TIMEOUT_MS)
      const cancelar = () => {
        window.clearTimeout(temporizador)
        controlador.abort()
      }
      cancelarSondeo = cancelar

      const disponible = await consultarSalud(controlador.signal).catch(() => false)
      window.clearTimeout(temporizador)
      if (cancelarSondeo !== cancelar) return
      cancelarSondeo = null
      if (controlador.signal.aborted) return

      fallos = disponible ? 0 : fallos + 1
      if (disponible || fallos >= 2) setEnLinea(disponible)
    }

    function alDesconectar() {
      cancelarSondeo?.()
      cancelarSondeo = null
      setEnLinea(false)
    }

    function alConectar() {
      if (USA_MOCKS) setEnLinea(true)
      else void sondear()
    }

    window.addEventListener('offline', alDesconectar)
    window.addEventListener('online', alConectar)
    const intervalo = USA_MOCKS ? undefined : window.setInterval(sondear, INTERVALO_MS)
    if (!USA_MOCKS) void sondear()

    return () => {
      window.removeEventListener('offline', alDesconectar)
      window.removeEventListener('online', alConectar)
      window.clearInterval(intervalo)
      cancelarSondeo?.()
      cancelarSondeo = null
    }
  }, [])

  return enLinea
}
