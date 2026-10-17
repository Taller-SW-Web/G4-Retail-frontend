const currencyFormatter = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrency(amount: number): string {
  return `S/ ${currencyFormatter.format(amount)}`
}

const dosDigitos = (n: number) => String(n).padStart(2, '0')

/** `DD/MM/YYYY` */
export function formatFecha(iso: string | Date): string {
  const fecha = new Date(iso)
  return `${dosDigitos(fecha.getDate())}/${dosDigitos(fecha.getMonth() + 1)}/${fecha.getFullYear()}`
}

/** `DD/MM/YYYY HH:mm` */
export function formatFechaHora(iso: string | Date): string {
  const fecha = new Date(iso)
  return `${formatFecha(fecha)} ${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`
}
