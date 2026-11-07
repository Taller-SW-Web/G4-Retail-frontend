// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import Receipt, { type VentaFinalizada } from './Receipt'

afterEach(() => {
  cleanup()
})

const ventaContingenciaMock: VentaFinalizada = {
  pedidoId: 'CONT-00001',
  tipoComprobante: 'BOLETA',
  medioPago: 'EFECTIVO',
  montoRecibido: 100,
  vuelto: 20,
  subtotal: 67.8,
  igv: 12.2,
  total: 80,
  items: [
    {
      sku: 'POLO-BLANCO-M',
      nombre: 'Polo Deportivo',
      talla: 'M',
      color: 'Blanco',
      cantidad: 1,
      precioUnitario: 80,
    },
  ],
  cliente: {
    id: 'CLI-001',
    nombre: 'Juan Pérez',
    tipoDocumento: 'DNI',
    numeroDocumento: '12345678',
  },
  vendedor: 'VEN-001',
  serie: 'B010',
  correlativo: 'CONT-00001',
  fechaEmision: '2026-11-07T12:00:00Z',
  esContingencia: true,
  correlativoContingencia: 'CONT-00001',
  hashIntegridad: '7c4a8d112233445566778899aabbccddeeff00112233445566778899aabbccdd',
}

describe('Receipt — Comprobante en Contingencia Offline (RF-27 / CA-10-04)', () => {
  it('renderiza cabecera y correlativo de contingencia correctamente', () => {
    render(<Receipt venta={ventaContingenciaMock} vista="venta" />)

    expect(
      screen.getByText('COMPROBANTE EMITIDO EN CONTINGENCIA OFFLINE')
    ).toBeTruthy()
    expect(screen.getByText('CONT-00001')).toBeTruthy()
  })

  it('muestra los primeros 8 caracteres del hash de integridad como comprobante de seguridad', () => {
    render(<Receipt venta={ventaContingenciaMock} vista="venta" />)

    expect(screen.getByText(/HASH SEGURIDAD: 7c4a8d11\.\.\./i)).toBeTruthy()
  })

  it('incluye la leyenda obligatoria de contingencia pendiente de sincronización fiscal', () => {
    render(<Receipt venta={ventaContingenciaMock} vista="venta" />)

    expect(
      screen.getByText(
        /Comprobante emitido en contingencia offline\. Pendiente de sincronización fiscal\./i
      )
    ).toBeTruthy()
  })
})
