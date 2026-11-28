// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { aProducto } from '../../../api/catalogoApi'
import { products } from '../../../data/products'
import { aplicarCuarentena, estaEnCuarentena, MENSAJE_BLOQUEO } from '../../../lib/cuarentena'
import { resolveScan } from '../../../lib/scanner'
import StockBadge from '../../molecules/StockBadge'
import ProductDetailModal from '../catalogo/ProductDetailModal'
import QuarantineBlockedModal from './QuarantineBlockedModal'

afterEach(() => cleanup())

const SKU_BLOQUEADO = 'ZAPVEL-38-NEG'
const velocity = () => aplicarCuarentena(products, new Set([SKU_BLOQUEADO])).find((p) => p.id === 'sku-1001')!

describe('Bloqueo de prendas en cuarentena en el POS (F12 · RF-33)', () => {
  it('CA-RF33-01: la talla reportada queda sin stock vendible y marcada en cuarentena; las demás no cambian', () => {
    const producto = velocity()
    const bloqueada = producto.variants!.find((v) => v.sku === SKU_BLOQUEADO)!
    const libre = producto.variants!.find((v) => v.sku === 'ZAPVEL-39-NEG')!

    expect(bloqueada.enCuarentena).toBe(true)
    expect(bloqueada.stock).toBe(0)
    expect(libre.enCuarentena).toBeUndefined()
    expect(libre.stock).toBe(3)
    expect(producto.stock).toBe(products[0].stock - 4)
  })

  it('CA-RF33-01: la ficha muestra la talla deshabilitada con el motivo "en revisión física"', () => {
    render(<ProductDetailModal product={velocity()} onAdd={() => {}} onClose={() => {}} />)

    const talla = screen.getByRole('button', { name: '38, en cuarentena' }) as HTMLButtonElement
    expect(talla.disabled).toBe(true)
    expect(talla.title).toBe('No disponible (en revisión física)')
  })

  it('CA-RF33-02: escanear la etiqueta de una prenda en cuarentena se detecta antes de agregarla', () => {
    const match = resolveScan(aplicarCuarentena(products, new Set([SKU_BLOQUEADO])), '7751001000012')!

    expect(estaEnCuarentena(match.product, match.variant)).toBe(true)
    const otra = resolveScan(aplicarCuarentena(products, new Set([SKU_BLOQUEADO])), '7751001000029')!
    expect(estaEnCuarentena(otra.product, otra.variant)).toBe(false)
  })

  it('CA-RF33-02: el aviso de bloqueo muestra la alerta explícita con la prenda', () => {
    const onClose = vi.fn()
    render(<QuarantineBlockedModal nombre="Zapatillas Velocity X" sku={SKU_BLOQUEADO} onClose={onClose} />)

    expect(screen.getByRole('alert').textContent).toContain(MENSAJE_BLOQUEO)
    expect(screen.getByRole('alert').textContent).toContain(SKU_BLOQUEADO)
    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('el semáforo dice "En cuarentena" en rojo, aunque haya existencias', () => {
    render(<StockBadge stock={8} enCuarentena />)

    const badge = screen.getByText('En cuarentena')
    expect(badge.closest('[data-tone]')?.getAttribute('data-tone')).toBe('error')
  })

  it('un artículo de talla única marcado enCuarentena por el backend llega bloqueado', () => {
    const producto = aProducto({
      productoId: 'PROD-9',
      nombre: 'Mancuerna 12 kg',
      variantes: [{ sku: 'MANC-12', talla: null, disponibilidad: 'DISPONIBLE', precio: 99, enCuarentena: true }],
    })

    expect(producto.enCuarentena).toBe(true)
    expect(producto.stock).toBe(0)
    expect(estaEnCuarentena(producto)).toBe(true)
  })
})
