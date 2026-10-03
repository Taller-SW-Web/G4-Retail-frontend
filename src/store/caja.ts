import { create } from 'zustand'
import type { EstadoCaja } from '../types'

interface CajaState {
  /** null mientras se consulta el estado del turno. */
  caja: EstadoCaja | null
  setCaja: (caja: EstadoCaja | null) => void
}

export const useCajaStore = create<CajaState>((set) => ({
  caja: null,
  setCaja: (caja) => set({ caja }),
}))
