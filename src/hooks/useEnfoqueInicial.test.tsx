// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useEnfoqueInicial } from './useEnfoqueInicial'

function CampoDeEscaneo() {
  const campo = useEnfoqueInicial<HTMLInputElement>()
  return <input ref={campo} aria-label="Número de boleta" />
}

describe('useEnfoqueInicial', () => {
  it('deja el cursor en el campo al abrir la pantalla para escanear sin usar el mouse', () => {
    render(<CampoDeEscaneo />)
    expect(document.activeElement).toBe(screen.getByLabelText('Número de boleta'))
  })
})
