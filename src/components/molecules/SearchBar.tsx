import { IconSearch } from '@tabler/icons-react'

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
    <label className="flex w-full items-center gap-2 rounded-xl border border-[var(--color-border-default)] bg-white px-4 py-3 text-sm text-[var(--color-text-secondary)] shadow-sm">
      <IconSearch size={18} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)]"
        placeholder={placeholder}
      />
    </label>
  )
}
