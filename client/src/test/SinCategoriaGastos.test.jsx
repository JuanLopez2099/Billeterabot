import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SinCategoriaGastos from '../pages/SinCategoriaGastos'
import { useCategorias } from '../context/useCategorias'
import { useCuentas } from '../context/useCuentas'
import { listarGastos, editarGasto, eliminarGasto } from '../services/gastos'
import { listarCuentas } from '../services/ingresos'

vi.mock('../context/useCategorias', () => ({ useCategorias: vi.fn() }))
vi.mock('../context/useCuentas', () => ({ useCuentas: vi.fn() }))
vi.mock('../services/gastos', () => ({
  listarGastos: vi.fn(),
  editarGasto: vi.fn(),
  eliminarGasto: vi.fn(),
}))
vi.mock('../services/ingresos', () => ({ listarCuentas: vi.fn() }))

const gastoSinCategoria = {
  id: 'gasto-sin-cat',
  monto: 9000,
  descripcion: 'Taxi',
  fecha: '2026-11-14',
  categoria: null,
  cuenta: { id: 'cuenta-1', nombre: 'Nequi' },
}

describe('SinCategoriaGastos', () => {
  let onCambiarPantalla

  beforeEach(() => {
    vi.clearAllMocks()
    onCambiarPantalla = vi.fn()

    useCategorias.mockReturnValue({
      categorias: [{ id: 'cat-1', nombre: 'Transporte' }],
      buscarPorNombre: vi.fn(),
      crear: vi.fn().mockResolvedValue({ id: 'cat-nueva' }),
    })
    useCuentas.mockReturnValue({
      buscarPorNombre: vi.fn(() => undefined),
    })
    listarGastos.mockResolvedValue([
      gastoSinCategoria,
      { ...gastoSinCategoria, id: 'gasto-con-cat', categoria: { id: 'cat-1' } },
    ])
    listarCuentas.mockResolvedValue([{ id: 'cuenta-1', nombre: 'Nequi' }])
    editarGasto.mockResolvedValue({})
    eliminarGasto.mockResolvedValue({})
  })

  function abrirPagina() {
    render(<SinCategoriaGastos onCambiarPantalla={onCambiarPantalla} />)
  }

  it('muestra gastos sin categoría', async () => {
    abrirPagina()

    expect(await screen.findByText('Taxi')).toBeInTheDocument()
  })

  it('asigna una categoría existente y navega a ella', async () => {
    const user = userEvent.setup()
    abrirPagina()

    await screen.findByText('Taxi')
    await user.click(screen.getByRole('button', { name: 'Editar' }))
    await user.selectOptions(screen.getByLabelText('Categoría'), 'cat-1')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(editarGasto).toHaveBeenCalledWith(
        'gasto-sin-cat',
        expect.objectContaining({ categoriaId: 'cat-1' }),
      )
      expect(onCambiarPantalla).toHaveBeenCalledWith('categoria:cat-1')
    })
  })

  it('permite guardar el gasto sin asignarle categoría', async () => {
    const user = userEvent.setup()
    abrirPagina()

    await screen.findByText('Taxi')
    await user.click(screen.getByRole('button', { name: 'Editar' }))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(editarGasto).toHaveBeenCalledWith(
        'gasto-sin-cat',
        expect.objectContaining({ categoriaId: null }),
      )
    })
    expect(onCambiarPantalla).not.toHaveBeenCalled()
  })

  it('solo elimina el gasto después de confirmar', async () => {
    const user = userEvent.setup()
    abrirPagina()

    await screen.findByText('Taxi')
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))

    let dialogo = screen.getByRole('heading', { name: 'Eliminar gasto' }).parentElement
    await user.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))
    expect(eliminarGasto).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    dialogo = screen.getByRole('heading', { name: 'Eliminar gasto' }).parentElement
    await user.click(within(dialogo).getByRole('button', { name: 'Eliminar' }))

    await waitFor(() => {
      expect(eliminarGasto).toHaveBeenCalledWith('gasto-sin-cat')
    })
  })
})