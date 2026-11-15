import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NuevoMovimientoModal from '../components/NuevoMovimientoModal'
import { useCuentas } from '../context/useCuentas'
import { useCategorias } from '../context/useCategorias'
import { crearGasto } from '../services/gastos'
import { crearIngreso } from '../services/ingresos'
import { crearTransferencia } from '../services/transferencias'

vi.mock('../context/useCuentas', () => ({ useCuentas: vi.fn() }))
vi.mock('../context/useCategorias', () => ({ useCategorias: vi.fn() }))
vi.mock('../services/gastos', () => ({ crearGasto: vi.fn() }))
vi.mock('../services/ingresos', () => ({ crearIngreso: vi.fn() }))
vi.mock('../services/transferencias', () => ({ crearTransferencia: vi.fn() }))

describe('NuevoMovimientoModal', () => {
  let onCerrar
  let onGuardado

  beforeEach(() => {
    vi.clearAllMocks()
    useCuentas.mockReturnValue({
      cuentas: [
        { id: 'cuenta-1', nombre: 'Nequi' },
        { id: 'cuenta-2', nombre: 'Efectivo' },
      ],
    })
    useCategorias.mockReturnValue({
      categorias: [{ id: 'categoria-1', nombre: 'Alimentación' }],
    })
    crearGasto.mockResolvedValue({})
    crearIngreso.mockResolvedValue({})
    crearTransferencia.mockResolvedValue({})
    onCerrar = vi.fn()
    onGuardado = vi.fn()
  })

  it('registra un gasto sin categoría y comunica que se guardó', async () => {
    const user = userEvent.setup()
    render(<NuevoMovimientoModal onCerrar={onCerrar} onGuardado={onGuardado} />)

    await user.type(screen.getByLabelText('Monto'), '15000')
    await user.selectOptions(screen.getByLabelText('Cuenta'), 'cuenta-1')
    await user.selectOptions(screen.getByLabelText('Categoría'), '__ninguna__')
    await user.type(screen.getByLabelText('Descripción (opcional)'), 'Almuerzo')
    await user.click(screen.getByRole('button', { name: 'Agregar gasto' }))

    await waitFor(() => {
      expect(crearGasto).toHaveBeenCalledWith(
        expect.objectContaining({
          monto: '15000',
          cuentaId: 'cuenta-1',
          categoriaId: null,
          descripcion: 'Almuerzo',
        }),
      )
    })
    expect(onGuardado).toHaveBeenCalledOnce()
    expect(onCerrar).toHaveBeenCalledOnce()
  })

  it('registra un ingreso usando la cuenta seleccionada', async () => {
    const user = userEvent.setup()
    render(<NuevoMovimientoModal onCerrar={onCerrar} onGuardado={onGuardado} />)

    await user.click(screen.getByRole('button', { name: 'Ingreso' }))
    await user.type(screen.getByLabelText('Monto'), '50000')
    await user.selectOptions(screen.getByLabelText('Cuenta'), 'cuenta-2')
    await user.type(screen.getByLabelText('Descripción (opcional)'), 'Pago')
    await user.click(screen.getByRole('button', { name: 'Agregar ingreso' }))

    await waitFor(() => {
      expect(crearIngreso).toHaveBeenCalledWith(
        expect.objectContaining({
          monto: '50000',
          cuentaId: 'cuenta-2',
          descripcion: 'Pago',
        }),
      )
    })
    expect(onGuardado).toHaveBeenCalledOnce()
    expect(onCerrar).toHaveBeenCalledOnce()
  })

  it('registra una transferencia entre las cuentas elegidas', async () => {
    const user = userEvent.setup()
    render(<NuevoMovimientoModal onCerrar={onCerrar} onGuardado={onGuardado} />)

    await user.click(screen.getByRole('button', { name: 'Transferencia' }))
    await user.type(screen.getByLabelText('Monto'), '20000')
    await user.selectOptions(screen.getByLabelText('Desde'), 'cuenta-1')
    await user.selectOptions(screen.getByLabelText('Hacia'), 'cuenta-2')
    await user.click(screen.getByRole('button', { name: 'Agregar transferencia' }))

    await waitFor(() => {
      expect(crearTransferencia).toHaveBeenCalledWith(
        expect.objectContaining({
          monto: '20000',
          cuentaOrigenId: 'cuenta-1',
          cuentaDestinoId: 'cuenta-2',
        }),
      )
    })
    expect(onGuardado).toHaveBeenCalledOnce()
    expect(onCerrar).toHaveBeenCalledOnce()
  })

  it('muestra el error si el servicio no puede guardar el movimiento', async () => {
    const user = userEvent.setup()
    crearGasto.mockRejectedValueOnce(new Error('No se pudo guardar'))
    render(<NuevoMovimientoModal onCerrar={onCerrar} onGuardado={onGuardado} />)

    await user.type(screen.getByLabelText('Monto'), '15000')
    await user.selectOptions(screen.getByLabelText('Cuenta'), 'cuenta-1')
    await user.selectOptions(screen.getByLabelText('Categoría'), 'categoria-1')
    await user.click(screen.getByRole('button', { name: 'Agregar gasto' }))

    expect(await screen.findByText('No se pudo guardar')).toBeInTheDocument()
    expect(onGuardado).not.toHaveBeenCalled()
    expect(onCerrar).not.toHaveBeenCalled()
  })
})