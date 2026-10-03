import { useId } from 'react'
import { IconAlertCircle } from '@tabler/icons-react'
import { Input, type InputProps } from '../atoms/Input'

interface FormFieldProps extends InputProps {
  label: string
  /** Texto auxiliar bajo el campo. */
  ayuda?: string
  /** Mensaje de error: pinta el borde rojo y reemplaza a la ayuda. */
  error?: string
}

export function FormField({ label, ayuda, error, estado, id, ...input }: FormFieldProps) {
  const autoId = useId()
  const campoId = id ?? autoId
  const mensajeId = `${campoId}-mensaje`
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={campoId} className="text-sm font-semibold">
        {label}
      </label>
      <Input id={campoId} estado={error ? 'error' : estado} aria-describedby={error || ayuda ? mensajeId : undefined} {...input} />
      {error ? (
        <p id={mensajeId} role="alert" className="flex items-center gap-1 text-xs text-error">
          <IconAlertCircle size={16} aria-hidden />
          {error}
        </p>
      ) : (
        ayuda && (
          <p id={mensajeId} className="text-xs text-text-secondary">
            {ayuda}
          </p>
        )
      )}
    </div>
  )
}
