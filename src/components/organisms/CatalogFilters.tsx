import type { Ref } from 'react'
import { Chip } from '../atoms/Chip'
import { Select } from '../atoms/Select'
import { SearchBar } from '../molecules/SearchBar'

export const DISCIPLINAS = ['Fútbol', 'Running', 'Training', 'Outdoor', 'Básquet']
export const MARCAS = ['Adidas', 'AeroSport', 'Inka Athletics', 'Nike', 'Puma', 'Spalding', 'The North Face', 'Under Armour']
export const CATEGORIAS = ['Textil', 'Calzado', 'Accesorios']

export interface FiltrosCatalogo {
  query: string
  disciplina: string
  marca: string
  categoria: string
}

interface CatalogFiltersProps {
  filtros: FiltrosCatalogo
  onChange: (filtros: FiltrosCatalogo) => void
  /** Enter en el buscador (lector de código de barras). */
  onScan: (codigo: string) => void
  searchRef?: Ref<HTMLInputElement>
}

/** RF-04: buscador con foco automático, chips por disciplina y filtros por marca/categoría. */
export function CatalogFilters({ filtros, onChange, onScan, searchRef }: CatalogFiltersProps) {
  const set = (cambio: Partial<FiltrosCatalogo>) => onChange({ ...filtros, ...cambio })
  return (
    <div className="flex flex-col gap-4">
      <SearchBar
        ref={searchRef}
        autoFocus
        value={filtros.query}
        onChange={(query) => set({ query })}
        onSubmit={onScan}
        label="Buscar productos"
        placeholder="Busca por nombre, marca o escanea el código de barras / SKU"
      />
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex max-w-full gap-2 overflow-x-auto" role="group" aria-label="Filtrar por disciplina">
          <Chip selected={!filtros.disciplina} onClick={() => set({ disciplina: '' })}>
            Todos
          </Chip>
          {DISCIPLINAS.map((disciplina) => (
            <Chip key={disciplina} selected={filtros.disciplina === disciplina} onClick={() => set({ disciplina })}>
              {disciplina}
            </Chip>
          ))}
        </div>
        <div className="flex max-w-full gap-2 sm:ml-auto">
          <Select aria-label="Filtrar por marca" value={filtros.marca} onChange={(e) => set({ marca: e.target.value })}>
            <option value="">Todas las marcas</option>
            {MARCAS.map((marca) => (
              <option key={marca}>{marca}</option>
            ))}
          </Select>
          <Select aria-label="Filtrar por categoría" value={filtros.categoria} onChange={(e) => set({ categoria: e.target.value })}>
            <option value="">Todas las categorías</option>
            {CATEGORIAS.map((categoria) => (
              <option key={categoria}>{categoria}</option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  )
}
