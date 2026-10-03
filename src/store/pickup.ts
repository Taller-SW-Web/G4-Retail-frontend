import { create } from 'zustand'

interface PickupState {
  /** Paquetes listos para recojo en la sede; null hasta la primera carga. */
  pendientes: number | null
  setPendientes: (pendientes: number) => void
}

export const usePickupStore = create<PickupState>((set) => ({
  pendientes: null,
  setPendientes: (pendientes) => set({ pendientes }),
}))
