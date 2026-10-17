import { formatCurrency } from '../../../lib/format'

export const MONEDAS = [0.1, 0.2, 0.5, 1, 2, 5]
export const BILLETES = [10, 20, 50, 100, 200]

export type Conteo = Record<string, number>

/** Total en soles de un conteo por denominación (opera en céntimos para no arrastrar decimales). */
export const totalConteo = (conteo: Conteo) =>
  Object.entries(conteo).reduce(
    (suma, [denominacion, cantidad]) => suma + Math.round(Number(denominacion) * 100) * cantidad,
    0,
  ) / 100

interface DenominationCounterProps {
  conteo: Conteo
  onChange: (conteo: Conteo) => void
  monedas?: number[]
  billetes?: number[]
}

/**
 * Conteo físico de monedas y billetes (RF-20 y RF-22).
 *
 * Es la pieza que hace posible el arqueo ciego: el cajero cuenta denominación por denominación y el
 * componente solo muestra el subtotal de cada una. El total se ve recién al final, cuando ya no hay
 * nada que corregir a la vista del saldo esperado.
 */
export default function DenominationCounter({
  conteo,
  onChange,
  monedas = MONEDAS,
  billetes = BILLETES,
}: DenominationCounterProps) {
  const grupo = (titulo: string, denominaciones: number[]) => (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold">{titulo}</legend>
      {denominaciones.map((denominacion) => {
        const cantidad = conteo[denominacion] ?? 0
        const id = `denominacion-${denominacion}`

        return (
          <div key={denominacion} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
            <label htmlFor={id} className="tabular-nums">
              {formatCurrency(denominacion)}
            </label>
            <input
              id={id}
              type="number"
              inputMode="numeric"
              min={0}
              value={cantidad || ''}
              placeholder="0"
              onChange={(evento) =>
                onChange({ ...conteo, [denominacion]: Math.max(Math.trunc(Number(evento.target.value)) || 0, 0) })
              }
              className="w-24 rounded-lg border border-border-default bg-white px-4 py-2 text-right tabular-nums focus:border-transparent focus:ring-2 focus:ring-accent-signal focus:outline-none"
            />
            <span className="text-right text-text-secondary tabular-nums">
              {formatCurrency(denominacion * cantidad)}
            </span>
          </div>
        )
      })}
    </fieldset>
  )

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {grupo('Monedas', monedas)}
      {grupo('Billetes', billetes)}
    </div>
  )
}
