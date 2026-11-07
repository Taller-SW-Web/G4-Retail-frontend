/**
 * Reglas de la inspección física de la prenda en pantalla (F9 · RF-24).
 *
 * Replican las del backend para que el vendedor sepa **antes de enviar** si el cambio procede: el
 * RF-24 pide que el botón "Aprobar cambio" quede bloqueado si falta una condición crítica. El backend
 * vuelve a validar igual; esto es ergonomía, no seguridad.
 */
import type { InspeccionPrenda, MotivoCambio } from '../api/cambiosApi'

export const MOTIVOS: { valor: MotivoCambio; etiqueta: string }[] = [
  { valor: 'CAMBIO_TALLA', etiqueta: 'Cambio de talla' },
  { valor: 'CAMBIO_MODELO', etiqueta: 'Cambio de modelo' },
  { valor: 'FALLA_FABRICA', etiqueta: 'Falla de fábrica' },
]

export interface EvaluacionInspeccion {
  puedeAprobar: boolean
  /** Condiciones críticas que faltan, en lenguaje del vendedor. */
  faltantes: string[]
  /** Falla de fábrica: es un caso de garantía, se deriva a Postventa y en mostrador no se emite vale. */
  porGarantia: boolean
}

export function evaluarInspeccion(motivo: MotivoCambio, inspeccion: InspeccionPrenda): EvaluacionInspeccion {
  if (motivo === 'FALLA_FABRICA') {
    return { puedeAprobar: false, faltantes: [], porGarantia: true }
  }

  const faltantes: string[] = []
  if (!inspeccion.etiquetasIntactas) faltantes.push('Etiquetas originales intactas')
  if (!inspeccion.sinSignosUso) faltantes.push('Prenda limpia y sin signos de uso')

  return { puedeAprobar: faltantes.length === 0, faltantes, porGarantia: false }
}
