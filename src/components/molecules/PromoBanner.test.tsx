// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { CampanaVigente } from '../../api/controlApi'
import { useCartStore } from '../../store/cart'
import PromoBanner, { etiquetaDescuento } from './PromoBanner'

const AHORA = new Date('2026-11-26T15:00:00Z')

const chimpunes: CampanaVigente = {
  campanaId: 'CMP-2026-011', titulo: '30% en chimpunes', descripcion: 'Con cupón en mostrador', tipoDescuento: 'PORCENTAJE',
  valor: 30, codigoCupon: 'GOAL2026', montoMinimo: 150, condiciones: 'No acumulable con otras promociones',
  vigenteDesde: '2026-11-20T05:00:00Z', vigenteHasta: '2026-11-30T04:59:59Z',
}
const medias: CampanaVigente = {
  ...chimpunes, campanaId: 'CMP-2026-014', titulo: '2x1 en medias', tipoDescuento: 'NXM', valor: null, codigoCupon: null,
  montoMinimo: null, condiciones: null,
}
const vencida: CampanaVigente = {
  ...chimpunes, campanaId: 'CMP-2026-001', titulo: 'Cyber de octubre', codigoCupon: 'CYBER10',
  vigenteDesde: '2026-10-01T05:00:00Z', vigenteHasta: '2026-10-31T04:59:59Z',
}

afterEach(() => {
  cleanup()
  useCartStore.setState({ items: [], cliente: null, cupon: '', carritosEnEspera: [] })
})

describe('PromoBanner (F11 · RF-31)', () => {
  it('despliega las campañas activas para Retail', () => {
    render(<PromoBanner campanas={[chimpunes, medias]} ahora={AHORA} />)

    expect(screen.getByRole('region', { name: 'Promociones del día en mostrador' })).toBeTruthy()
    expect(screen.getByText('30% en chimpunes')).toBeTruthy()
    expect(screen.getByText('2x1 en medias')).toBeTruthy()
    expect(screen.getByText('- 30 %')).toBeTruthy()
  })

  it('clic en una campaña con cupón lo inyecta al carrito POS', () => {
    render(<PromoBanner campanas={[chimpunes]} ahora={AHORA} />)

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cupón GOAL2026: 30% en chimpunes' }))

    expect(useCartStore.getState().cupon).toBe('GOAL2026')
    expect(screen.getByRole('status').textContent).toBe('Cupón GOAL2026 aplicado al carrito')
    expect(screen.getByRole('button', { name: /Aplicar cupón GOAL2026/ }).getAttribute('aria-pressed')).toBe('true')
  })

  it('una campaña sin cupón no cambia el carrito', () => {
    useCartStore.setState({ cupon: 'VERANO2026' })
    render(<PromoBanner campanas={[medias]} ahora={AHORA} />)

    const chip = screen.getByRole('button', { name: '2x1 en medias (se aplica sin cupón)' }) as HTMLButtonElement
    expect(chip.disabled).toBe(true)
    fireEvent.click(chip)
    expect(useCartStore.getState().cupon).toBe('VERANO2026')
  })

  it('las campañas expiradas no aparecen en el tablón', () => {
    render(<PromoBanner campanas={[chimpunes, vencida]} ahora={AHORA} />)

    expect(screen.queryByText('Cyber de octubre')).toBeNull()
    expect(screen.getByText('30% en chimpunes')).toBeTruthy()
  })

  it('sin campañas vigentes no ocupa espacio en el POS', () => {
    const { container } = render(<PromoBanner campanas={[vencida]} ahora={AHORA} />)
    expect(container.innerHTML).toBe('')
  })

  it('"Ver condiciones" despliega las restricciones y el monto mínimo', () => {
    render(<PromoBanner campanas={[chimpunes]} ahora={AHORA} />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver condiciones de 30% en chimpunes' }))

    const condiciones = screen.getByRole('region', { name: 'Condiciones de 30% en chimpunes' })
    expect(condiciones.textContent).toContain('No acumulable con otras promociones')
    expect(condiciones.textContent).toContain('S/ 150.00')

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar condiciones' }))
    expect(screen.queryByRole('region', { name: /Condiciones de/ })).toBeNull()
  })

  it('redacta el descuento con el formato del sistema de diseño', () => {
    expect(etiquetaDescuento(chimpunes)).toBe('- 30 %')
    expect(etiquetaDescuento({ ...chimpunes, tipoDescuento: 'MONTO_FIJO', valor: 20 })).toBe('- S/ 20.00')
    expect(etiquetaDescuento(medias)).toBeNull()
  })
})
