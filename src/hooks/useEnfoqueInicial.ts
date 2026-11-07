import { useEffect, useRef } from 'react'

/**
 * Pone el foco en el campo principal al montar la pantalla, para que el vendedor pueda escanear
 * o teclear de inmediato. Reemplaza al atributo `autoFocus`, que se aplica antes de que la
 * pantalla termine de montarse.
 */
export function useEnfoqueInicial<T extends HTMLElement>() {
  const referencia = useRef<T>(null)

  useEffect(() => {
    referencia.current?.focus()
  }, [])

  return referencia
}
