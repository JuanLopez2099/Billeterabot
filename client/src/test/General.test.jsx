import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import General from '../pages/General'
import { obtenerResumen } from '../services/resumen'
import { listarHistorial } from '../services/historial'
import { useCategorias } from '../context/useCategorias'
import { useCuentas } from '../context/useCuentas'

vi.mock('../services/resumen', () => ({ obtenerResumen: vi.fn() }))
vi.mock('../services/historial', () => ({ listarHistorial: vi.fn() }))
vi.mock('../context/useCategorias', () => ({ useCategorias: vi.fn() }))
vi.mock('../context/useCuentas', () => ({ useCuentas: vi.fn() }))
vi.mock('../services/gastos', () => ({ crearGasto: vi.fn() }))
vi.mock('../services/ingresos', () => ({ crearIngreso: vi.fn() }))
vi.mock('../services/transferencias', () => ({ crearTransferencia: vi.fn() }))

vi.mock('recharts', () => {
  const GraficoSimulado = () => null
  return {
    PieChart: GraficoSimulado,
    Pie: GraficoSimulado,
    Cell: GraficoSimulado,
    BarChart: GraficoSimulado,
    Bar: GraficoSimulado,
    LineChart: GraficoSimulado,
    Line: GraficoSimulado,
    XAxis: GraficoSimulado,
    YAxis: GraficoSimulado,
    CartesianGrid: GraficoSimulado,
    Tooltip: GraficoSimulado,
    Legend: GraficoSimulado,
    ResponsiveContainer: GraficoSimulado,
  }
})

const resumen = {
  saldoDisponible: 100000,
  ingresosEsteMes: 120000,
  gastadoEsteMes: 20000,
  balanceMes: 100000,
  variacionGastos: null,
  porcentajeAhorro: 83,
  promedioDiarioGasto: 1000,
  saldoPorCuenta: [],
  topGastos: [],
  distribucionCategoria: [],
  ingresosVsGastos: [],
  gastoAcumulado: [],
  gastoPorDiaSemana: [],
}

describe('General', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCategorias.mockReturnValue({ categorias: [] })
    useCuentas.mockReturnValue({ cuentas: [] })
    obtenerResumen.mockResolvedValue(resumen)
    listarHistorial.mockResolvedValue([])
  })

  it('muestra el resumen y la opción de nuevo movimiento', async () => {
    render(<General />)

    expect(await screen.findByRole('heading', { name: 'General' })).toBeInTheDocument()
    expect(screen.getByText('Saldo por cuenta')).toBeInTheDocument()
    expect(screen.getByText('Top 5 de gastos')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nuevo movimiento/ })).toBeInTheDocument()
  })

  it('abre el formulario de movimientos desde el dashboard', async () => {
    const user = userEvent.setup()
    render(<General />)

    await screen.findByRole('heading', { name: 'General' })
    await user.click(screen.getByRole('button', { name: /Nuevo movimiento/ }))

    expect(await screen.findByRole('heading', { name: 'Nuevo movimiento' })).toBeInTheDocument()
  })

  it('vuelve a consultar resumen e historial cuando la ventana recupera el foco', async () => {
    render(<General />)

    await screen.findByRole('heading', { name: 'General' })
    const llamadasResumen = obtenerResumen.mock.calls.length
    const llamadasHistorial = listarHistorial.mock.calls.length

    window.dispatchEvent(new Event('focus'))

    await waitFor(() => {
      expect(obtenerResumen.mock.calls.length).toBeGreaterThan(llamadasResumen)
      expect(listarHistorial.mock.calls.length).toBeGreaterThan(llamadasHistorial)
    })
  })
})