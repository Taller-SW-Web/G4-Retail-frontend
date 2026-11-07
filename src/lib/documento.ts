/**
 * Validación estricta de documentos de identidad en mostrador (F3 · RF-09).
 *
 * Son las mismas reglas que aplica el backend (`ValidadorDocumento.java`), homologadas con Ventas
 * (G5) y Seguridad (G7). Aquí sirven para la ergonomía del vendedor: la máscara impide teclear
 * caracteres prohibidos y el mensaje en vivo dice qué falta **antes** de enviar. El backend vuelve a
 * validar y responde `400 DATO_INVALIDO` si algo se cuela.
 *
 * - DNI: exactamente 8 dígitos (`^\d{8}$`).
 * - RUC: exactamente 11 dígitos que empiezan con 10 o 20 (`^(10|20)\d{9}$`).
 * - CE (carné de extranjería): 9 a 12 caracteres alfanuméricos.
 * - PASAPORTE: 6 a 16 caracteres alfanuméricos.
 */
import type { TipoDocumento } from '../types'

export interface ReglaDocumento {
  /** Nombre corto para botones y mensajes. */
  etiqueta: string
  /** Nombre accesible del campo de captura. */
  nombreCampo: string
  patron: RegExp
  min: number
  max: number
  /** `true` para DNI y RUC: solo admiten dígitos. CE y pasaporte admiten letras. */
  soloDigitos: boolean
  placeholder: string
}

export const REGLAS_DOCUMENTO: Record<TipoDocumento, ReglaDocumento> = {
  DNI: {
    etiqueta: 'DNI',
    nombreCampo: 'DNI del cliente',
    patron: /^\d{8}$/,
    min: 8,
    max: 8,
    soloDigitos: true,
    placeholder: 'DNI: 8 dígitos',
  },
  RUC: {
    etiqueta: 'RUC',
    nombreCampo: 'RUC de la empresa',
    patron: /^(10|20)\d{9}$/,
    min: 11,
    max: 11,
    soloDigitos: true,
    placeholder: 'RUC: 11 dígitos (10… o 20…)',
  },
  CE: {
    etiqueta: 'CE',
    nombreCampo: 'Carné de extranjería del cliente',
    patron: /^[A-Z0-9]{9,12}$/,
    min: 9,
    max: 12,
    soloDigitos: false,
    placeholder: 'CE: 9 a 12 caracteres',
  },
  PASAPORTE: {
    etiqueta: 'Pasaporte',
    nombreCampo: 'Pasaporte del cliente',
    patron: /^[A-Z0-9]{6,16}$/,
    min: 6,
    max: 16,
    soloDigitos: false,
    placeholder: 'Pasaporte: 6 a 16 caracteres',
  },
}

export const TIPOS_DOCUMENTO: TipoDocumento[] = ['DNI', 'RUC', 'CE', 'PASAPORTE']

/**
 * Máscara de captura: descarta lo que el tipo no admite y corta en la longitud máxima.
 * DNI y RUC solo conservan dígitos 0-9; CE y pasaporte, letras A-Z y dígitos, en mayúsculas.
 */
export function enmascararDocumento(tipo: TipoDocumento, valor: string): string {
  const regla = REGLAS_DOCUMENTO[tipo]
  const limpio = regla.soloDigitos
    ? valor.replace(/[^0-9]/g, '')
    : valor.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return limpio.slice(0, regla.max)
}

export type EstadoDocumento =
  | { valido: true; mensaje: string }
  | { valido: false; incompleto: boolean; mensaje: string }

/**
 * Evalúa el documento para la validación en vivo.
 *
 * `incompleto` distingue "todavía falta escribir" (aviso neutro) de "esto está mal" (error rojo),
 * así el vendedor no ve rojo mientras teclea un DNI de 8 dígitos.
 */
export function evaluarDocumento(tipo: TipoDocumento, valor: string): EstadoDocumento {
  const regla = REGLAS_DOCUMENTO[tipo]

  if (regla.patron.test(valor)) {
    return { valido: true, mensaje: `${regla.etiqueta} válido.` }
  }

  if (tipo === 'RUC' && valor.length >= 2 && !/^(10|20)/.test(valor)) {
    return {
      valido: false,
      incompleto: false,
      mensaje: `Prefijo ${valor.slice(0, 2)} no autorizado: el RUC debe empezar con 10 o 20.`,
    }
  }

  if (valor.length < regla.min) {
    const faltan = regla.min - valor.length
    const unidad = regla.soloDigitos ? (faltan === 1 ? 'dígito' : 'dígitos') : faltan === 1 ? 'carácter' : 'caracteres'
    const rango = regla.min === regla.max ? `${regla.min}` : `${regla.min} a ${regla.max}`
    return {
      valido: false,
      incompleto: true,
      mensaje: `Faltan ${faltan} ${unidad} (${regla.etiqueta} de ${rango} ${regla.soloDigitos ? 'dígitos' : 'caracteres'}).`,
    }
  }

  return {
    valido: false,
    incompleto: false,
    mensaje: regla.soloDigitos
      ? `El ${regla.etiqueta} debe tener exactamente ${regla.min} dígitos numéricos.`
      : `El ${regla.etiqueta} debe tener de ${regla.min} a ${regla.max} caracteres alfanuméricos.`,
  }
}

export function esDocumentoValido(tipo: TipoDocumento, valor: string): boolean {
  return REGLAS_DOCUMENTO[tipo].patron.test(valor)
}

/**
 * Sintaxis de correo del alta rápida (RF-09), idéntica a `ClienteAltaRapidaRequest.PATRON_EMAIL`.
 * Parte local sin puntos consecutivos ni en los extremos; dominio con etiquetas alfanuméricas (guion
 * solo interno) separadas por un punto y un TLD de al menos 2 letras. Rechaza `rosa@correo..com`.
 */
const PATRON_EMAIL = /^[^\s@.]+(\.[^\s@.]+)*@([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/

export function esCorreoValido(valor: string): boolean {
  return PATRON_EMAIL.test(valor)
}
