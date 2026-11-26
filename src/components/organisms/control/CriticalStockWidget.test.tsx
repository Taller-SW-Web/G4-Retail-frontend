// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { VarianteCritica } from '../../../api/controlApi'
import CriticalStockWidget, { textoCentral } from './CriticalStockWidget'

const agotada: VarianteCritica = {
  sku: 'ZAP-RUN-42', productoId: 'PROD-101', nombreProducto: 'Zapatilla Running Pro', talla: '42', color: 'Negro',
  nivel: 'AGOTADO', stockTienda: 0, disponibleEnCentral: true, stockCentral: 45,
}
const critica: VarianteCritica = {
  sku: 'ZAPVEL-41-AZU', productoId: 'PROD-102', nombreProducto: 'Zapatillas Velocity X', talla: '41', color: 'Azul',
  nivel: 'CRITICO', stockTienda: 2, disponibleEnCentral: true, stockCentral: 12,
}
const sinCantidades: VarianteCritica = {
  ...critica, sku: 'TOPPRO-M-NEG', nombreProducto: 'Top de compresión Pro', stockTienda: null, disponibleEnCentral: null, stockCentral: null,
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const tarjeta = (nombre: string) => screen.getByText(nombre).closest('li') as HTMLElement

describe('CriticalStockWidget (F11 · RF-29)', () => {
  it('muestra el badge rojo "Agotado en tienda" para 0 unidades', () => {
    render(<CriticalStockWidget variantes={[agotada]} />)

    const badge = within(tarjeta('Zapatilla Running Pro')).getByText('Agotado en tienda')
    expect(badge.closest('[data-tone]')?.getAttribute('data-tone')).toBe('error')
  })

  it('muestra el badge ámbar con las últimas unidades', () => {
    render(<CriticalStockWidget variantes={[critica]} />)

    const badge = within(tarjeta('Zapatillas Velocity X')).getByText('Quedan 2 unidades')
    expect(badge.closest('[data-tone]')?.getAttribute('data-tone')).toBe('warning')
  })

  it('indica las existencias del almacén central', () => {
    render(<CriticalStockWidget variantes={[agotada]} />)
    expect(within(tarjeta('Zapatilla Running Pro')).getByText('Central: 45 disponibles')).toBeTruthy()
  })

  it('sin cantidades de Productos (X-P0-03) muestra solo el semáforo', () => {
    render(<CriticalStockWidget variantes={[sinCantidades]} />)

    const item = tarjeta('Top de compresión Pro')
    expect(within(item).getByText('Últimas unidades')).toBeTruthy()
    expect(within(item).getByText('Central: sin dato de Productos')).toBeTruthy()
  })

  it('copia el SKU al portapapeles con un clic', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render(<CriticalStockWidget variantes={[agotada]} />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copiar SKU ZAP-RUN-42' }))
    })

    expect(writeText).toHaveBeenCalledWith('ZAP-RUN-42')
    expect(screen.getByRole('status').textContent).toBe('SKU ZAP-RUN-42 copiado')
  })

  it('se colapsa y se expande', () => {
    render(<CriticalStockWidget variantes={[agotada, critica]} />)
    const encabezado = screen.getByRole('button', { name: /Semáforo de stock de tienda/ })

    expect(encabezado.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(encabezado)
    expect(encabezado.getAttribute('aria-expanded')).toBe('false')
    expect(screen.getByText('1 agotada · 1 en últimas unidades')).toBeTruthy()
  })

  it('sin alertas muestra que el stock está en orden', () => {
    render(<CriticalStockWidget variantes={[]} />)
    expect(screen.getByText('Stock en orden')).toBeTruthy()
  })

  it('redacta el almacén central según lo que informe Productos', () => {
    expect(textoCentral({ ...agotada, stockCentral: 1 })).toBe('Central: 1 disponible')
    expect(textoCentral({ ...agotada, stockCentral: 0 })).toBe('Central: sin unidades')
    expect(textoCentral({ ...agotada, stockCentral: null, disponibleEnCentral: true })).toBe('Central: con unidades disponibles')
    expect(textoCentral({ ...agotada, stockCentral: null, disponibleEnCentral: false })).toBe('Central: sin unidades')
  })
})
