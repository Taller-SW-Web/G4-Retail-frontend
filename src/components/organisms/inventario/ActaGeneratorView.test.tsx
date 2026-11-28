// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ActaGeneratorView from './ActaGeneratorView'
import { emitirActa, listarCuarentena, type IncidenciaCuarentena } from '../../../api/actasMermaApi'
import { useAuthStore } from '../../../store/authStore'

vi.mock('../../../api/actasMermaApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../api/actasMermaApi')>()),
  listarCuarentena: vi.fn(),
  emitirActa: vi.fn(),
}))

const PRENDAS: IncidenciaCuarentena[] = [
  {
    incidenciaId: 'inc-1',
    sku: 'POLTEC-M-BLA',
    nombreProducto: 'Polo técnico DryFit M blanco',
    tipoFalla: 'MANCHADO_PROBADOR',
    fechaReporte: '2026-11-22T15:00:00Z',
    estado: 'EN_CUARENTENA',
  },
  {
    incidenciaId: 'inc-2',
    sku: 'ZAPVEL-38-NEG',
    nombreProducto: 'Zapatilla Velocity 38 negro',
    tipoFalla: 'COSTURA_ROTA',
    fechaReporte: '2026-11-23T15:00:00Z',
    estado: 'EN_CUARENTENA',
  },
  {
    incidenciaId: 'inc-3',
    sku: 'SHORUN-S-NEG',
    nombreProducto: 'Short running S negro',
    tipoFalla: 'DEFECTO_FABRICA',
    fechaReporte: '2026-11-26T15:00:00Z',
    estado: 'PENDIENTE_REPORTE',
  },
]

const estadoInicial = useAuthStore.getState()

beforeEach(() => {
  vi.mocked(listarCuarentena).mockResolvedValue(PRENDAS)
  useAuthStore.setState({
    perfil: {
      usuarioId: 'bbbbbbbb-0000-0000-0000-000000000002',
      codigoVendedor: 'SUP-001',
      perfilTienda: 'SUPERVISOR',
      tiendaId: 'TIENDA-MIRAFLORES',
      activo: true,
    },
  })
})

afterEach(() => {
  cleanup()
  vi.mocked(listarCuarentena).mockReset()
  vi.mocked(emitirActa).mockReset()
  useAuthStore.setState(estadoInicial, true)
})

describe('ActaGeneratorView (RF-34)', () => {
  it('lista las prendas en cuarentena para seleccionarlas', async () => {
    render(<ActaGeneratorView />)

    expect(await screen.findByLabelText('Incluir POLTEC-M-BLA')).toBeTruthy()
    expect(screen.getByLabelText('Incluir ZAPVEL-38-NEG')).toBeTruthy()
  })

  it('CA-RF34-04: emitir sin prendas seleccionadas muestra la validación y no llama al servidor', async () => {
    render(<ActaGeneratorView />)
    await screen.findByLabelText('Incluir POLTEC-M-BLA')
    fireEvent.click(screen.getByLabelText('Devolución a almacén central por garantía'))

    fireEvent.click(screen.getByRole('button', { name: /Emitir acta/ }))

    expect(screen.getByText('Selecciona al menos una prenda en cuarentena para emitir el acta.')).toBeTruthy()
    expect(emitirActa).not.toHaveBeenCalled()
  })

  it('una prenda que Inventario aún no aceptó se muestra, pero no se puede incluir', async () => {
    render(<ActaGeneratorView />)

    const casilla = (await screen.findByLabelText('Incluir SHORUN-S-NEG')) as HTMLInputElement
    expect(casilla.disabled).toBe(true)
    expect(screen.getByText('Esperando confirmación de Inventario')).toBeTruthy()
  })

  it('la casilla general selecciona todas las prendas que pueden entrar al acta', async () => {
    render(<ActaGeneratorView />)
    await screen.findByLabelText('Incluir POLTEC-M-BLA')

    fireEvent.click(screen.getByLabelText('Seleccionar todas'))

    expect(screen.getByRole('button', { name: 'Emitir acta (2)' })).toBeTruthy()
  })

  it('CA-RF34-01: al confirmar emite el acta, retira las prendas de la bandeja y muestra el acta', async () => {
    vi.mocked(emitirActa).mockResolvedValue({
      actaNumero: 'ACTA-MERMA-2026-0012',
      fechaEmision: '2026-11-28T18:00:00Z',
      tiendaId: 'TIENDA-MIRAFLORES',
      tipoDestino: 'BAJA_DEFINITIVA',
      observaciones: 'Mancha permanente',
      supervisor: { id: 'bbbbbbbb-0000-0000-0000-000000000002', nombre: 'Rosa Quispe' },
      totalPrendas: 1,
      incidencias: [
        {
          incidenciaId: 'inc-1',
          sku: 'POLTEC-M-BLA',
          tipoFalla: 'MANCHADO_PROBADOR',
          detalleObservacion: 'Mancha de maquillaje en el cuello',
          estado: 'BAJA_DEFINITIVA',
        },
      ],
    })
    render(<ActaGeneratorView />)
    fireEvent.click(await screen.findByLabelText('Incluir POLTEC-M-BLA'))
    fireEvent.click(screen.getByLabelText('Baja por deterioro o merma irrecuperable'))
    fireEvent.change(screen.getByLabelText('Observaciones (opcional)'), { target: { value: 'Mancha permanente' } })

    fireEvent.click(screen.getByRole('button', { name: /Emitir acta \(1\)/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Emitir acta' }))

    expect(await screen.findByRole('article', { name: 'Acta ACTA-MERMA-2026-0012' })).toBeTruthy()
    expect(emitirActa).toHaveBeenCalledWith({
      incidenciasIds: ['inc-1'],
      tipoDestino: 'BAJA_DEFINITIVA',
      observaciones: 'Mancha permanente',
    })
    expect(screen.getByText('Rosa Quispe', { selector: 'dd' })).toBeTruthy()
    expect(screen.getByText(/Las prendas pasaron a BAJA_DEFINITIVA/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Volver a la cuarentena' }))
    await waitFor(() => expect(screen.queryByLabelText('Incluir POLTEC-M-BLA')).toBeNull())
    expect(screen.getByLabelText('Incluir ZAPVEL-38-NEG')).toBeTruthy()
  })

  it('muestra el motivo si el servidor rechaza el acta', async () => {
    const { ApiError } = await import('../../../api/http')
    vi.mocked(emitirActa).mockRejectedValue(
      new ApiError(409, { code: 'INCIDENCIA_NO_EN_CUARENTENA', detail: 'Una de las prendas ya no está en cuarentena' }),
    )
    render(<ActaGeneratorView />)
    fireEvent.click(await screen.findByLabelText('Incluir POLTEC-M-BLA'))
    fireEvent.click(screen.getByLabelText('Ajuste por faltante o pérdida'))

    fireEvent.click(screen.getByRole('button', { name: /Emitir acta \(1\)/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Emitir acta' }))

    expect(await screen.findByText('Una de las prendas ya no está en cuarentena')).toBeTruthy()
  })
})
