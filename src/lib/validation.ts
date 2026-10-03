import type { TipoDocumento } from '../types'

export const soloDigitos = (valor: string, max: number) => valor.replace(/\D/g, '').slice(0, max)

export const longitudDocumento = (tipo: TipoDocumento) => (tipo === 'DNI' ? 8 : 11)

export const esEmailValido = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())

export const esDniValido = (dni: string) => /^\d{8}$/.test(dni)

export const esRucValido = (ruc: string) => /^(10|20)\d{9}$/.test(ruc)

export interface EstadoDocumento {
  valido: boolean
  /** Ayuda tenue mientras se escribe. */
  ayuda?: string
  /** Error de formato (borde rojo). */
  error?: string
}

/** RF-09: validación inline de DNI (8 dígitos) y RUC (11 dígitos, prefijo 10 o 20). */
export function validarDocumento(tipo: TipoDocumento, valor: string): EstadoDocumento {
  const longitud = longitudDocumento(tipo)
  if (tipo === 'RUC' && valor.length >= 2 && !/^(10|20)/.test(valor)) {
    return { valido: false, error: 'Un RUC debe comenzar con 10 o 20' }
  }
  if (valor.length < longitud) {
    return { valido: false, ayuda: `Ingrese ${longitud} dígitos (faltan ${longitud - valor.length})` }
  }
  return { valido: true }
}
