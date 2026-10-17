import { useRef, useState, type FormEvent } from 'react'
import { IconBarcode } from '@tabler/icons-react'
import Button from '../../atoms/Button'

type ScannerSimulatorProps = {
  onScan: (code: string) => void
  /** Códigos reales del catálogo, para probar sin tener la etiqueta física delante. */
  samples?: Array<{ code: string; label: string }>
}

/**
 * Simulador del lector de código de barras (RF-04).
 *
 * El lector físico es un teclado: escribe el código y envía Enter. Este campo hace exactamente eso,
 * así que la pantalla no distingue si el código lo disparó la pistola o lo tecleó el vendedor, y la
 * demo no depende de tener el hardware conectado.
 *
 * El foco vuelve al campo después de cada lectura: en mostrador se escanean varias prendas
 * seguidas, y obligar a hacer clic entre una y otra es justo el tiempo que se pierde en la cola.
 */
export default function ScannerSimulator({ onScan, samples = [] }: ScannerSimulatorProps) {
  const [code, setCode] = useState('')
  const input = useRef<HTMLInputElement>(null)

  const scan = (value: string) => {
    if (!value.trim()) return
    onScan(value.trim())
    setCode('')
    input.current?.focus()
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    scan(code)
  }

  return (
    <section
      aria-labelledby="titulo-lector"
      className="flex flex-col gap-3 rounded-2xl border border-dashed border-[var(--color-border-default)] bg-white p-4 shadow-sm lg:flex-row lg:items-center"
    >
      <h2
        id="titulo-lector"
        className="flex shrink-0 items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]"
      >
        <IconBarcode size={20} aria-hidden="true" />
        Lector de códigos
      </h2>

      <form onSubmit={submit} className="flex shrink-0 gap-2">
        <input
          ref={input}
          type="text"
          value={code}
          autoFocus
          autoComplete="off"
          aria-label="Código de barras o SKU a escanear"
          placeholder="Código de barras o SKU"
          onChange={(event) => setCode(event.target.value)}
          className="w-56 rounded-xl border border-[var(--color-border-default)] bg-white px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-accent-signal)] focus:ring-2 focus:ring-[var(--color-accent-signal-soft)]"
        />
        <Button type="submit" variant="primary" disabled={!code.trim()}>
          Escanear
        </Button>
      </form>

      {samples.length > 0 ? (
        <ul aria-label="Códigos de prueba" className="flex min-w-0 flex-wrap gap-2">
          {samples.map((sample) => (
            <li key={sample.code}>
              <button
                type="button"
                title={`Escanear: ${sample.label}`}
                aria-label={`Escanear código de prueba ${sample.code}: ${sample.label}`}
                onClick={() => scan(sample.code)}
                className="rounded-lg bg-[var(--color-surface-cloud-subtle)] px-3 py-2 text-xs font-semibold tabular-nums text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-border-default)]"
              >
                {sample.code}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
