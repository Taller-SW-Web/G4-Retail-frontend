type CategoryFilterProps = {
  categories: string[]
  value: string
  onChange: (category: string) => void
}

export default function CategoryFilter({ categories, value, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
      {['Todas', ...categories].map((category) => (
        <button
          key={category}
          type="button"
          aria-pressed={value === category}
          onClick={() => onChange(category)}
          className={[
            'rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
            value === category
              ? 'bg-[var(--color-surface-ink)] text-[var(--color-text-inverse)]'
              : 'bg-[var(--color-surface-cloud-subtle)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-default)]',
          ].join(' ')}
        >
          {category}
        </button>
      ))}
    </div>
  )
}
