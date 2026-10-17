/**
 * Bultos arribados para retiro en tienda (F7 · RF-18).
 *
 * Solo guarda el contador de pendientes que otras pantallas pueden mostrar como badge. Las llamadas
 * al backend viven en `api/pickupApi.ts`.
 */
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
