import { beforeEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import Sidebar from '../components/Sidebar'
import { useCategorias } from '../context/useCategorias'
import { render, screen, waitFor, within } from '@testing-library/react'

vi.mock('../context/useCategorias', () => ({ useCategorias: vi.fn() }))

const categoria = {
  id: 'cat-1',
  nombre: 'Alimentación',
  color: '#123456',
  icono: 'alimentacion',
}

describe('Sidebar', () => {
  let crear
  let editar
  let eliminar
  let onCambiar

  beforeEach(() => {
    vi.clearAllMocks()
    crear = vi.fn().mockResolvedValue({})
    editar = vi.fn().mockResolvedValue({})
    eliminar = vi.fn().mockResolvedValue({})
    onCambiar = vi.fn()
    useCategorias.mockReturnValue({ categorias: [categoria], crear, editar, eliminar })
  })

  it('navega a una categoría al seleccionar su elemento', async () => {
    const user = userEvent.setup()
    render(<Sidebar pantalla="general" onCambiar={onCambiar} />)

    await user.click(screen.getByText('Alimentación').closest('[role="button"]'))

    expect(onCambiar).toHaveBeenCalledWith('categoria:cat-1')
  })

  it('crea una categoría desde la opción del menú', async () => {
    const user = userEvent.setup()
    render(<Sidebar pantalla="general" onCambiar={onCambiar} />)

    await user.click(screen.getByRole('button', { name: /Nueva categoría/ }))
    await user.type(screen.getByLabelText('Nombre'), 'Mascotas')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(crear).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Mascotas' }),
      )
    })
  })

  it('carga los datos actuales al editar una categoría', async () => {
    const user = userEvent.setup()
    render(<Sidebar pantalla="general" onCambiar={onCambiar} />)

    await user.click(screen.getByRole('button', { name: 'Editar categoría' }))

    expect(screen.getByRole('heading', { name: 'Editar categoría' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveValue('Alimentación')
  })

  it('guarda los cambios de una categoría', async () => {
    const user = userEvent.setup()
    render(<Sidebar pantalla="general" onCambiar={onCambiar} />)

    await user.click(screen.getByRole('button', { name: 'Editar categoría' }))
    await user.clear(screen.getByLabelText('Nombre'))
    await user.type(screen.getByLabelText('Nombre'), 'Comida')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(editar).toHaveBeenCalledWith(
        'cat-1',
        expect.objectContaining({ nombre: 'Comida' }),
      )
    })
  })

  it('al eliminar la categoría activa, regresa a General', async () => {
    const user = userEvent.setup()
    render(<Sidebar pantalla="categoria:cat-1" onCambiar={onCambiar} />)

    await user.click(screen.getByRole('button', { name: 'Eliminar categoría' }))
    const dialogo = screen.getByRole('heading', { name: 'Eliminar categoría' }).parentElement
    await user.click(within(dialogo).getByRole('button', { name: 'Eliminar' }))

    await waitFor(() => {
      expect(eliminar).toHaveBeenCalledWith('cat-1')
      expect(onCambiar).toHaveBeenCalledWith('general')
    })
  })
})