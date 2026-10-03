import type { Ref } from 'react'
import { IconSearch, IconX } from '@tabler/icons-react'
import { ActionIcon } from '../atoms/ActionIcon'
import { Input } from '../atoms/Input'

interface SearchBarProps {
  value: string
  onChange: (valor: string) => void
  /** Enter: lo emite el lector de código de barras al terminar de leer. */
  onSubmit?: (valor: string) => void
  placeholder: string
  label: string
  autoFocus?: boolean
  ref?: Ref<HTMLInputElement>
}

export function SearchBar({ value, onChange, onSubmit, placeholder, label, autoFocus, ref }: SearchBarProps) {
  return (
    <form
      role="search"
      className="relative"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.(value)
      }}
    >
      <Input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        autoFocus={autoFocus}
        icon={<IconSearch size={20} aria-hidden />}
        className="py-4 pr-12 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <ActionIcon aria-label="Limpiar búsqueda" className="absolute inset-y-0 right-2 my-auto h-fit" onClick={() => onChange('')}>
          <IconX size={20} aria-hidden />
        </ActionIcon>
      )}
    </form>
  )
}
