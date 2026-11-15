import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Cuentas from '../pages/Cuentas'
import { useCuentas } from '../context/useCuentas'
import { obtenerResumen } from '../services/resumen'

vi.mock('../context/useCuentas', () => ({ useCuentas: vi.fn() }))
vi.mock('../services/resumen', () => ({ obtenerResumen: vi.fn() }))

describe('Cuentas', () => {
  let crear
  let eliminar

  beforeEach(() => {
    vi.clearAllMocks()
    crear = vi.fn().mockResolvedValue({})
    eliminar = vi.fn().mockResolvedValue({})
    const cuentas = [
      { id: 'propia-1', nombre: 'Ahorros', es_propia: true },
      { id: 'predef-1', nombre: 'Nequi', es_propia: false },
    ]

    useCuentas.mockReturnValue({
      cuentas,
      buscarPorNombre: vi.fn((nombre) => cuentas.find((cuenta) => cuenta.nombre === nombre)),
      crear,
      eliminar,
    })
    
    obtenerResumen.mockResolvedValue({
      saldoPorCuenta: [
        { cuentaId: 'propia-1', saldo: -2000 },
        { cuentaId: 'predef-1', saldo: 75000 },
      ],
    })
  })

  it('muestra las cuentas propias y predefinidas por separado', async () => {
    render(<Cuentas />)

    expect(screen.getByText('Mis cuentas')).toBeInTheDocument()
    expect(screen.getByText('Cuentas predefinidas')).toBeInTheDocument()
    expect(screen.getByText('Ahorros')).toBeInTheDocument()
    const tarjetaPredefinidas =
      screen.getByRole('heading', { name: 'Cuentas predefinidas' }).parentElement
    expect(within(tarjetaPredefinidas).getByText('Nequi')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Eliminar cuenta' })).toHaveLength(1)
  })

  it('crea una cuenta propia con el nombre ingresado', async () => {
    const user = userEvent.setup()
    render(<Cuentas />)

    await user.type(screen.getByLabelText('Nombre'), 'Viajes')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    await waitFor(() => {
      expect(crear).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Viajes' }),
      )
    })
  })

  it('cancela la eliminación sin llamar al servicio', async () => {
    const user = userEvent.setup()
    render(<Cuentas />)

    await user.click(screen.getByRole('button', { name: 'Eliminar cuenta' }))
    const dialogo = screen.getByRole('heading', { name: 'Eliminar cuenta' }).parentElement
    await user.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))

    expect(eliminar).not.toHaveBeenCalled()
  })

  it('elimina una cuenta propia al confirmar', async () => {
    const user = userEvent.setup()
    render(<Cuentas />)

    await user.click(screen.getByRole('button', { name: 'Eliminar cuenta' }))
    const dialogo = screen.getByRole('heading', { name: 'Eliminar cuenta' }).parentElement
    await user.click(within(dialogo).getByRole('button', { name: 'Eliminar' }))

    await waitFor(() => {
      expect(eliminar).toHaveBeenCalledWith('propia-1')
    })
  })

  it('muestra el error si falla la creación de la cuenta', async () => {
    const user = userEvent.setup()
    crear.mockRejectedValueOnce(new Error('No se pudo crear la cuenta'))
    render(<Cuentas />)

    await user.type(screen.getByLabelText('Nombre'), 'Viajes')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByText('No se pudo crear la cuenta')).toBeInTheDocument()
  })
})
