import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Ingresos from '../pages/Ingresos'
import {
  listarIngresos,
  crearIngreso,
  editarIngreso,
  eliminarIngreso,
  listarCuentas,
} from '../services/ingresos'
import { useCuentas } from '../context/useCuentas'

vi.mock('../context/useCuentas', () => ({ useCuentas: vi.fn() }))
vi.mock('../services/ingresos', () => ({
  listarIngresos: vi.fn(),
  crearIngreso: vi.fn(),
  editarIngreso: vi.fn(),
  eliminarIngreso: vi.fn(),
  listarCuentas: vi.fn(),
}))

const ingreso = {
  id: 'ingreso-1',
  monto: 50000,
  descripcion: 'Pago quincena',
  fecha: '2026-11-14',
  cuenta: { id: 'cuenta-1', nombre: 'Nequi' },
}

describe('Ingresos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listarIngresos.mockResolvedValue([ingreso])
    listarCuentas.mockResolvedValue([{ id: 'cuenta-1', nombre: 'Nequi' }])
    crearIngreso.mockResolvedValue({})
    editarIngreso.mockResolvedValue({})
    eliminarIngreso.mockResolvedValue({})
    useCuentas.mockReturnValue({
      buscarPorNombre: vi.fn(() => undefined),
    })
  })

  it('muestra los ingresos y su cuenta', async () => {
    render(<Ingresos />)

    const botonEditar = await screen.findByRole('button', { name: 'Editar' })
    const fila = botonEditar.closest('li')

    expect(within(fila).getByText('Pago quincena')).toBeInTheDocument()
    expect(within(fila).getByText('Nequi')).toBeInTheDocument()
  })

  it('crea un ingreso con los campos del formulario', async () => {
    const user = userEvent.setup()
    render(<Ingresos />)

    await user.type(screen.getByLabelText('Monto'), '80000')
    await user.selectOptions(screen.getByLabelText('Cuenta'), 'cuenta-1')
    await user.type(screen.getByLabelText('Descripción (opcional)'), 'Venta')
    await user.click(screen.getByRole('button', { name: 'Agregar ingreso' }))

    await waitFor(() => {
      expect(crearIngreso).toHaveBeenCalledWith(
        expect.objectContaining({
          monto: '80000',
          cuentaId: 'cuenta-1',
          descripcion: 'Venta',
        }),
      )
    })
  })

  it('edita un ingreso existente', async () => {
    const user = userEvent.setup()
    render(<Ingresos />)

    await screen.findByText('Pago quincena')
    await user.click(screen.getByRole('button', { name: 'Editar' }))
    await user.clear(screen.getByLabelText('Monto'))
    await user.type(screen.getByLabelText('Monto'), '60000')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(editarIngreso).toHaveBeenCalledWith(
        'ingreso-1',
        expect.objectContaining({ monto: '60000' }),
      )
    })
  })

  it('permite cancelar la eliminación y luego eliminar al confirmar', async () => {
    const user = userEvent.setup()
    render(<Ingresos />)

    await screen.findByText('Pago quincena')
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    let dialogo = screen.getByRole('heading', { name: 'Eliminar ingreso' }).parentElement
    await user.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))
    expect(eliminarIngreso).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    dialogo = screen.getByRole('heading', { name: 'Eliminar ingreso' }).parentElement
    await user.click(within(dialogo).getByRole('button', { name: 'Eliminar' }))

    await waitFor(() => {
      expect(eliminarIngreso).toHaveBeenCalledWith('ingreso-1')
    })
  })

  it('muestra un mensaje si falla la creación', async () => {
    const user = userEvent.setup()
    crearIngreso.mockRejectedValueOnce(new Error('No se pudo crear el ingreso'))
    render(<Ingresos />)

    await user.type(screen.getByLabelText('Monto'), '80000')
    await user.selectOptions(screen.getByLabelText('Cuenta'), 'cuenta-1')
    await user.click(screen.getByRole('button', { name: 'Agregar ingreso' }))

    expect(await screen.findByText('No se pudo crear el ingreso')).toBeInTheDocument()
  })
})
