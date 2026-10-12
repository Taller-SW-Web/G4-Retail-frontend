import { useEffect, useRef } from 'react'

const EVENTO = 'pos:escaneo'

/** Emite una lectura como lo haría el lector físico al terminar de leer una etiqueta. */
export const emitirEscaneo = (codigo: string) => window.dispatchEvent(new CustomEvent<string>(EVENTO, { detail: codigo }))

/** Suscribe la pantalla a las lecturas del simulador de lector de barras. */
export function useEscaner(alEscanear: (codigo: string) => void) {
  const handler = useRef(alEscanear)
  handler.current = alEscanear
  useEffect(() => {
    const escuchar = (e: Event) => handler.current((e as CustomEvent<string>).detail)
    window.addEventListener(EVENTO, escuchar)
    return () => window.removeEventListener(EVENTO, escuchar)
  }, [])
}
