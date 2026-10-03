import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Usuario } from '../types'

interface AuthState {
  token: string | null
  usuario: Usuario | null
  /** Motivo por el que se volvió al login (acceso restringido, sesión expirada). */
  aviso: string | null
  iniciarSesion: (token: string, usuario: Usuario) => void
  cerrarSesion: (aviso?: string) => void
  expirarSesion: () => void
  limpiarAviso: () => void
}

// RF-03: token y perfil viven en sessionStorage (sobreviven a F5, no a cerrar la pestaña).
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      usuario: null,
      aviso: null,
      iniciarSesion: (token, usuario) => set({ token, usuario, aviso: null }),
      cerrarSesion: (aviso) => set({ token: null, usuario: null, aviso: aviso ?? null }),
      expirarSesion: () => get().cerrarSesion('Su sesión ha expirado por inactividad o fin de turno'),
      limpiarAviso: () => set({ aviso: null }),
    }),
    {
      name: 'g4-retail-sesion',
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ token, usuario }) => ({ token, usuario }),
    },
  ),
)
