import { beforeEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import GastosCategoria from '../pages/GastosCategoria'
import { useCategorias } from '../context/useCategorias'
import { listarGastos, crearGasto, editarGasto, eliminarGasto } from '../services/gastos'
import { listarCuentas } from '../services/ingresos'
import { render, screen, waitFor, within } from '@testing-library/react'
import { useCuentas } from '../context/useCuentas'

vi.mock('../context/useCuentas', () => ({ useCuentas: vi.fn() }))
vi.mock('../context/useCategorias', () => ({ useCategorias: vi.fn() }))
vi.mock('../services/gastos', () => ({
  listarGastos: vi.fn(),
  crearGasto: vi.fn(),
  editarGasto: vi.fn(),
  eliminarGasto: vi.fn(),
}))
vi.mock('../services/ingresos', () => ({ listarCuentas: vi.fn() }))

const gastoAlimentacion = {
  id: 'gasto-1',
  monto: 12000,
  descripcion: 'Almuerzo',
  fecha: '2026-11-14',
  categoria: { id: 'cat-1', nombre: 'Alimentación' },
  cuenta: { id: 'cuenta-1', nombre: 'Nequi' },
}

const gastoOcio = {
  id: 'gasto-2',
  monto: 30000,
  descripcion: 'Película',
  fecha: '2026-11-13',
  categoria: { id: 'cat-2', nombre: 'Ocio' },
  cuenta: { id: 'cuenta-1', nombre: 'Nequi' },
}

describe('GastosCategoria', () => {
  let onCambiarPantalla
  let crearCategoria

  beforeEach(() => {
    vi.clearAllMocks()
    onCambiarPantalla = vi.fn()
    crearCategoria = vi.fn().mockResolvedValue({ id: 'cat-nueva', nombre: 'Mascotas' })
    useCuentas.mockReturnValue({
      buscarPorNombre: vi.fn(() => undefined),
    })

    useCategorias.mockReturnValue({
      categorias: [
        { id: 'cat-1', nombre: 'Alimentación', es_predefinida: true },
        { id: 'cat-2', nombre: 'Ocio', es_predefinida: true },
      ],
      buscarPorNombre: vi.fn(),
      crear: crearCategoria,
    })
    listarGastos.mockResolvedValue([gastoAlimentacion, gastoOcio])
    listarCuentas.mockResolvedValue([{ id: 'cuenta-1', nombre: 'Nequi' }])
    crearGasto.mockResolvedValue({})
    editarGasto.mockResolvedValue({})
    eliminarGasto.mockResolvedValue({})
  })

  function abrirPagina() {
    render(
      <GastosCategoria categoriaId="cat-1" onCambiarPantalla={onCambiarPantalla} />,
    )
  }

  it('muestra únicamente los gastos de la categoría abierta', async () => {
    abrirPagina()

    expect(await screen.findByText('Almuerzo')).toBeInTheDocument()
    expect(screen.queryByText('Película')).not.toBeInTheDocument()
  })

  it('carga los datos del gasto al iniciar la edición y guarda los cambios', async () => {
    const user = userEvent.setup()
    abrirPagina()

    await screen.findByText('Almuerzo')
    await user.click(screen.getByRole('button', { name: 'Editar' }))
    await user.clear(screen.getByLabelText('Monto'))
    await user.type(screen.getByLabelText('Monto'), '18000')
    await user.clear(screen.getByLabelText('Descripción (opcional)'))
    await user.type(screen.getByLabelText('Descripción (opcional)'), 'Cena')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(editarGasto).toHaveBeenCalledWith(
        'gasto-1',
        expect.objectContaining({ monto: '18000', descripcion: 'Cena' }),
      )
    })
  })

  it('cancela la eliminación sin llamar al servicio', async () => {
    const user = userEvent.setup()
    abrirPagina()

    await screen.findByText('Almuerzo')
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    await user.click(
      screen.getByRole('button', { name: 'Cancelar' }),
    )

    expect(eliminarGasto).not.toHaveBeenCalled()
  })

  it('elimina el gasto después de confirmar', async () => {
    const user = userEvent.setup()
    abrirPagina()

    await screen.findByText('Almuerzo')
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    const dialogo = screen.getByRole('heading', { name: 'Eliminar gasto' }).parentElement
    await user.click(within(dialogo).getByRole('button', { name: 'Eliminar' }))

    await waitFor(() => {
      expect(eliminarGasto).toHaveBeenCalledWith('gasto-1')
    })
  })

  it('crea una categoría nueva y lleva a esa categoría tras guardar el gasto', async () => {
    const user = userEvent.setup()
    abrirPagina()

    await user.type(screen.getByLabelText('Monto'), '25000')
    await user.selectOptions(screen.getByLabelText('Cuenta'), 'cuenta-1')
    await user.selectOptions(
      screen.getByLabelText('Categoría'),
      '__nueva__',
    )
    await user.type(screen.getByLabelText('Nombre'), 'Mascotas')
    await user.click(screen.getByRole('button', { name: 'Agregar gasto' }))

    await waitFor(() => {
      expect(crearCategoria).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Mascotas' }),
      )
      expect(crearGasto).toHaveBeenCalledWith(
        expect.objectContaining({ categoriaId: 'cat-nueva' }),
      )
      expect(onCambiarPantalla).toHaveBeenCalledWith('categoria:cat-nueva')
    })
  })

  it('muestra el error cuando falla el guardado', async () => {
    const user = userEvent.setup()
    editarGasto.mockRejectedValueOnce(new Error('Error al actualizar'))
    abrirPagina()

    await screen.findByText('Almuerzo')
    await user.click(screen.getByRole('button', { name: 'Editar' }))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Error al actualizar')).toBeInTheDocument()
  })
})