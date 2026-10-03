const soles = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** `S/ 1,199.90` — signo de soles, espacio, separador de miles y 2 decimales. */
export const formatSoles = (monto: number) => `S/ ${soles.format(monto)}`

const dosDigitos = (n: number) => String(n).padStart(2, '0')

/** `DD/MM/YYYY` */
export function formatFecha(iso: string | Date) {
  const d = new Date(iso)
  return `${dosDigitos(d.getDate())}/${dosDigitos(d.getMonth() + 1)}/${d.getFullYear()}`
}

/** `DD/MM/YYYY HH:mm` */
export function formatFechaHora(iso: string | Date) {
  const d = new Date(iso)
  return `${formatFecha(d)} ${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}`
}

export const formatHora = (iso: string | Date) => formatFechaHora(iso).slice(11)

export const nombreTienda = (tiendaId: string) =>
  'Tienda ' +
  tiendaId
    .replace(/^TIENDA-/, '')
    .toLowerCase()
    .replace(/(^|-)(\w)/g, (_, sep: string, c: string) => (sep ? ' ' : '') + c.toUpperCase())

export const etiquetaRol = (rol: string) => rol.charAt(0) + rol.slice(1).toLowerCase()
