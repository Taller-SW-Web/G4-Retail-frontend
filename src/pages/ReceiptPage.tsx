import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { IconArrowLeft, IconGift, IconPlus, IconPrinter, IconReceipt2 } from '@tabler/icons-react'
import Button from '../components/atoms/Button'
import Receipt from '../components/organisms/cobro/Receipt'
import type { VentaFinalizada } from '../components/organisms/cobro/Receipt'

/**
 * Lee la venta guardada en sessionStorage por PaymentModal al confirmar.
 * Se borra al iniciar nueva venta para evitar re-renders con datos viejos.
 */
function leerVenta(): VentaFinalizada | null {
  try {
    const raw = sessionStorage.getItem('f5_ultima_venta')
    return raw ? (JSON.parse(raw) as VentaFinalizada) : null
  } catch {
    return null
  }
}

type Vista = 'venta' | 'cambio'

/**
 * F5 — RF-15: Pantalla de éxito con el comprobante emitido y sus acciones de impresión.
 * Ruta: /pos/comprobante
 * Responsable: MIGUEL
 */
export default function ReceiptPage() {
  const navigate = useNavigate()
  const [vista, setVista] = useState<Vista>('venta')
  const venta = leerVenta()

  // Si no hay venta en sesión, redirigir al POS
  if (!venta) return <Navigate to="/pos" replace />

  function imprimir(cual: Vista) {
    setVista(cual)
    // Pequeño delay para que React pinte el ticket antes de abrir el diálogo
    setTimeout(() => window.print(), 100)
  }

  function nuevaVenta() {
    sessionStorage.removeItem('f5_ultima_venta')
    navigate('/pos')
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-cloud)] p-4 md:p-6">
      {/* header — oculto al imprimir */}
      <header className="print:hidden mx-auto mb-6 flex max-w-xl items-center justify-between rounded-2xl border border-[var(--color-border-default)] bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={nuevaVenta}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border-default)] px-3 py-1.5 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-cloud-subtle)] transition-colors"
          >
            <IconArrowLeft size={16} /> Volver al POS
          </button>
          <div className="flex items-center gap-2">
            <IconReceipt2 className="text-[var(--color-accent-volt)]" size={22} />
            <h1 className="font-heading text-xl uppercase text-[var(--color-text-primary)]">
              Venta completada
            </h1>
          </div>
        </div>
      </header>

      {/* alerta de éxito — oculta al imprimir */}
      <div className="print:hidden mx-auto mb-4 max-w-xl rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        <span className="font-semibold">Pedido {venta.pedidoId} registrado.</span> Todo listo.
        Entrega el comprobante al cliente.
      </div>

      {/* selector vista venta/cambio — oculto al imprimir */}
      <div className="print:hidden mx-auto mb-4 flex max-w-xl gap-2">
        <button
          onClick={() => setVista('venta')}
          className={[
            'flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
            vista === 'venta'
              ? 'border-[var(--color-surface-ink)] bg-[var(--color-surface-ink)] text-[var(--color-text-inverse)]'
              : 'border-[var(--color-border-default)] bg-white text-[var(--color-text-primary)] hover:bg-[var(--color-surface-cloud-subtle)]',
          ].join(' ')}
        >
          Comprobante
        </button>
        <button
          onClick={() => setVista('cambio')}
          className={[
            'flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
            vista === 'cambio'
              ? 'border-[var(--color-surface-ink)] bg-[var(--color-surface-ink)] text-[var(--color-text-inverse)]'
              : 'border-[var(--color-border-default)] bg-white text-[var(--color-text-primary)] hover:bg-[var(--color-surface-cloud-subtle)]',
          ].join(' ')}
        >
          <IconGift size={16} aria-hidden /> Ticket de Cambio
        </button>
      </div>

      {/* ticket imprimible */}
      <Receipt venta={venta} vista={vista} />

      {/* acciones — ocultas al imprimir */}
      <div className="print:hidden mx-auto mt-6 flex max-w-xl flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
        <Button
          onClick={() => imprimir('venta')}
          className="flex items-center gap-2"
        >
          <IconPrinter size={18} aria-hidden /> Imprimir Ticket
        </Button>

        <button
          onClick={() => imprimir('cambio')}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--color-border-default)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-cloud-subtle)] transition-colors"
        >
          <IconGift size={18} aria-hidden /> Imprimir Ticket de Cambio
        </button>

        <button
          onClick={nuevaVenta}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--color-border-default)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-cloud-subtle)] transition-colors"
        >
          <IconPlus size={18} aria-hidden /> Nueva Venta
        </button>
      </div>
    </div>
  )
}
