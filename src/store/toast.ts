import { create } from 'zustand'

export type TipoToast = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: number
  tipo: TipoToast
  mensaje: string
}

interface ToastState {
  toasts: ToastItem[]
  mostrar: (tipo: TipoToast, mensaje: string) => void
  cerrar: (id: number) => void
}

const DURACION_MS = 4500
let siguienteId = 1

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  mostrar: (tipo, mensaje) => {
    const id = siguienteId++
    set({ toasts: [...get().toasts, { id, tipo, mensaje }] })
    setTimeout(() => get().cerrar(id), DURACION_MS)
  },
  cerrar: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))

export const toast = {
  success: (mensaje: string) => useToastStore.getState().mostrar('success', mensaje),
  error: (mensaje: string) => useToastStore.getState().mostrar('error', mensaje),
  warning: (mensaje: string) => useToastStore.getState().mostrar('warning', mensaje),
}
