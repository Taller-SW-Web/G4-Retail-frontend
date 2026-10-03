import { IconMinus, IconPlus, IconTrash } from '@tabler/icons-react'
import { ActionIcon } from '../atoms/ActionIcon'

interface QuantityStepperProps {
  cantidad: number
  max: number
  nombre: string
  onChange: (cantidad: number) => void
  onRemove: () => void
}

/** Controles `-` / input / `+` de una línea del carrito (RF-10). */
export function QuantityStepper({ cantidad, max, nombre, onChange, onRemove }: QuantityStepperProps) {
  const enMaximo = cantidad >= max
  return (
    <div className="inline-flex items-center rounded-lg border border-border-default bg-white">
      {cantidad <= 1 ? (
        <ActionIcon aria-label={`Eliminar ${nombre} del carrito`} tone="danger" onClick={onRemove}>
          <IconTrash size={16} aria-hidden />
        </ActionIcon>
      ) : (
        <ActionIcon aria-label={`Reducir cantidad de ${nombre}`} onClick={() => onChange(cantidad - 1)}>
          <IconMinus size={16} aria-hidden />
        </ActionIcon>
      )}
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={cantidad}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`Cantidad de ${nombre}`}
        className="w-8 [appearance:textfield] text-center text-sm font-semibold focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <ActionIcon
        aria-label={`Aumentar cantidad de ${nombre}`}
        title={enMaximo ? 'Stock máximo disponible en tienda alcanzado' : undefined}
        disabled={enMaximo}
        onClick={() => onChange(cantidad + 1)}
      >
        <IconPlus size={16} aria-hidden />
      </ActionIcon>
    </div>
  )
}
