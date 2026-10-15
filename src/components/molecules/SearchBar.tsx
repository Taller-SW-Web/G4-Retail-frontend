import { IconSearch, IconX } from '@tabler/icons-react'

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar productos',
}: SearchBarProps) {
  return (
    <div className="flex w-full items-center gap-2 rounded-xl border border-[var(--color-border-default)] bg-white px-4 py-3 text-sm text-[var(--color-text-secondary)] shadow-sm focus-within:border-[var(--color-accent-signal)] focus-within:ring-2 focus-within:ring-[var(--color-accent-signal-soft)]">
      <IconSearch size={18} />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={placeholder}
        className="w-full bg-transparent text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)]"
        placeholder={placeholder}
      />
      {value ? (
        <button
          type="button"
          aria-label="Limpiar búsqueda"
          onClick={() => onChange('')}
          className="rounded p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-cloud-subtle)]"
        >
          <IconX aria-hidden="true" size={16} />
        </button>
      ) : null}
    </div>
  )
}
