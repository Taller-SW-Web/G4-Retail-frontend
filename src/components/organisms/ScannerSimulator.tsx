import { useState, type FormEvent } from 'react'
import { IconBarcode } from '@tabler/icons-react'
import { Button } from '../atoms/Button'
import { Input } from '../atoms/Input'
import { emitirEscaneo } from '../../lib/scanner'

export interface CodigoEjemplo {
  codigo: string
  etiqueta: string
}

interface ScannerSimulatorProps {
  /** Códigos de barras reales del catálogo para probar sin etiquetas físicas. */
  ejemplos: CodigoEjemplo[]
}

/** Simulador del lector de código de barras: envía el código escrito como una lectura del lector físico. */
export function ScannerSimulator({ ejemplos }: ScannerSimulatorProps) {
  const [codigo, setCodigo] = useState('')

  function escanear(e: FormEvent) {
    e.preventDefault()
    if (!codigo.trim()) return
    emitirEscaneo(codigo.trim())
    setCodigo('')
  }

  return (
    <aside
      aria-labelledby="titulo-simulador"
      className="flex flex-col gap-2 rounded-xl border border-dashed border-text-secondary bg-white p-2 lg:flex-row lg:items-center print:hidden"
    >
      <h2 id="titulo-simulador" className="flex shrink-0 items-center gap-2 text-sm font-semibold">
        <IconBarcode size={20} aria-hidden />
        Simulador de lector
      </h2>
      <form onSubmit={escanear} className="flex shrink-0 gap-2">
        <Input
          aria-label="Código de barras o SKU a escanear"
          placeholder="Código de barras o SKU"
          autoComplete="off"
          className="lg:w-52"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
        />
        <Button type="submit" disabled={!codigo.trim()}>
          Escanear
        </Button>
      </form>
      {ejemplos.length > 0 && (
        <ul aria-label="Códigos de prueba" className="flex min-w-0 gap-1 overflow-x-auto">
          {ejemplos.map(({ codigo: ejemplo, etiqueta }) => (
            <li key={ejemplo}>
              <button
                type="button"
                title={`Escanear: ${etiqueta}`}
                aria-label={`Escanear código de prueba ${ejemplo}: ${etiqueta}`}
                onClick={() => emitirEscaneo(ejemplo)}
                className="rounded-lg bg-surface-cloud-subtle px-2 py-2 text-xs font-semibold whitespace-nowrap tabular-nums hover:bg-border-default"
              >
                {ejemplo}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
