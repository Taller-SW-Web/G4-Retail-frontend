/**
 * Estado global del turno de caja (F8).
 *
 * Es uno de los tres estados que `AGENTS.md` autoriza a vivir en el store global, junto con la
 * sesión y el carrito: el turno abierto condiciona toda la aplicación (si no hay turno, no se
 * vende), así que varias pantallas necesitan leerlo.
 *
 * Lo que el usuario escribe en los modales no entra aquí: eso es estado local de la pantalla.
 */
import { create } from 'zustand'
import type { ReporteZResponse, TurnoCajaResponse } from '../api/caja'

interface CajaStore {
  /** `null` mientras se consulta el turno; `estado: 'CERRADA'` si no hay ninguno abierto. */
  caja: TurnoCajaResponse | null
  /** Resultado del último cierre, para pintar el Reporte Z. */
  ultimoReporteZ: ReporteZResponse | null
  setCaja: (caja: TurnoCajaResponse | null) => void
  setUltimoReporteZ: (reporte: ReporteZResponse | null) => void
  reiniciar: () => void
}

export const useCajaStore = create<CajaStore>((set) => ({
  caja: null,
  ultimoReporteZ: null,
  setCaja: (caja) => set({ caja }),
  setUltimoReporteZ: (ultimoReporteZ) => set({ ultimoReporteZ }),
  reiniciar: () => set({ caja: null, ultimoReporteZ: null }),
}))
