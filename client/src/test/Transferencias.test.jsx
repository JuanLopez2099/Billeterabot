import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Transferencias from '../pages/Transferencias'
import {
  listarTransferencias,
  crearTransferencia,
  editarTransferencia,
  eliminarTransferencia,
} from '../services/transferencias'
import { listarCuentas } from '../services/ingresos'
import { useCuentas } from '../context/useCuentas'

vi.mock('../context/useCuentas', () => ({ useCuentas: vi.fn() }))
vi.mock('../services/transferencias', () => ({
  listarTransferencias: vi.fn(),
  crearTransferencia: vi.fn(),
  editarTransferencia: vi.fn(),
  eliminarTransferencia: vi.fn(),
}))
vi.mock('../services/ingresos', () => ({ listarCuentas: vi.fn() }))

const transferencia = {
  id: 'transferencia-1',
  monto: 20000,
  fecha: '2026-11-14',
  cuenta_origen: { id: 'cuenta-1', nombre: 'Nequi' },
  cuenta_destino: { id: 'cuenta-2', nombre: 'Efectivo' },
}

describe('Transferencias', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listarTransferencias.mockResolvedValue([transferencia])
    listarCuentas.mockResolvedValue([
      { id: 'cuenta-1', nombre: 'Nequi' },
      { id: 'cuenta-2', nombre: 'Efectivo' },
    ])
    crearTransferencia.mockResolvedValue({})
    editarTransferencia.mockResolvedValue({})
    eliminarTransferencia.mockResolvedValue({})
    useCuentas.mockReturnValue({
      buscarPorNombre: vi.fn(() => undefined),
    })
  })

  it('muestra la transferencia y las cuentas de origen y destino', async () => {
    render(<Transferencias />)

    const botonEditar = await screen.findByRole('button', { name: 'Editar' })
    const fila = botonEditar.closest('li')

    expect(within(fila).getByText('Nequi')).toBeInTheDocument()
    expect(within(fila).getByText('Efectivo')).toBeInTheDocument()
  })

  it('crea una transferencia con las cuentas seleccionadas', async () => {
    const user = userEvent.setup()
    render(<Transferencias />)

    await user.type(screen.getByLabelText('Monto'), '30000')
    await user.selectOptions(screen.getByLabelText('Desde'), 'cuenta-1')
    await user.selectOptions(screen.getByLabelText('Hacia'), 'cuenta-2')
    await user.click(screen.getByRole('button', { name: 'Agregar transferencia' }))

    await waitFor(() => {
      expect(crearTransferencia).toHaveBeenCalledWith(
        expect.objectContaining({
          monto: '30000',
          cuentaOrigenId: 'cuenta-1',
          cuentaDestinoId: 'cuenta-2',
        }),
      )
    })
  })

  it('edita una transferencia existente', async () => {
    const user = userEvent.setup()
    render(<Transferencias />)

    await screen.findByRole('button', { name: 'Editar' })
    await user.click(screen.getByRole('button', { name: 'Editar' }))
    await user.clear(screen.getByLabelText('Monto'))
    await user.type(screen.getByLabelText('Monto'), '45000')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(editarTransferencia).toHaveBeenCalledWith(
        'transferencia-1',
        expect.objectContaining({ monto: '45000' }),
      )
    })
  })

  it('permite cancelar la eliminación y luego confirmarla', async () => {
    const user = userEvent.setup()
    render(<Transferencias />)

    await screen.findByRole('button', { name: 'Editar' })
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    let dialogo = screen.getByRole('heading', { name: 'Eliminar transferencia' }).parentElement
    await user.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))
    expect(eliminarTransferencia).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    dialogo = screen.getByRole('heading', { name: 'Eliminar transferencia' }).parentElement
    await user.click(within(dialogo).getByRole('button', { name: 'Eliminar' }))

    await waitFor(() => {
      expect(eliminarTransferencia).toHaveBeenCalledWith('transferencia-1')
    })
  })

  it('muestra el error si falla el registro', async () => {
    const user = userEvent.setup()
    crearTransferencia.mockRejectedValueOnce(new Error('Error al transferir'))
    render(<Transferencias />)

    await user.type(screen.getByLabelText('Monto'), '30000')
    await user.selectOptions(screen.getByLabelText('Desde'), 'cuenta-1')
    await user.selectOptions(screen.getByLabelText('Hacia'), 'cuenta-2')
    await user.click(screen.getByRole('button', { name: 'Agregar transferencia' }))

    expect(await screen.findByText('Error al transferir')).toBeInTheDocument()
  })
})
