import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from '../pages/Login'
import Register from '../pages/Register'
import { supabase } from '../lib/supabaseClient'

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signUp: vi.fn(),
    },
  },
}))

describe('Autenticación', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabase.auth.signInWithPassword.mockResolvedValue({ error: null })
    supabase.auth.signInWithOAuth.mockResolvedValue({ error: null })
    supabase.auth.signUp.mockResolvedValue({ error: null })
  })

  it('inicia sesión con correo y contraseña', async () => {
    const user = userEvent.setup()
    render(<Login />)

    await user.type(screen.getByPlaceholderText('tucorreo@ejemplo.com'), 'ana@mail.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'secreto123')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'ana@mail.com',
        password: 'secreto123',
      })
    })
  })

  it('muestra el error devuelto al iniciar sesión', async () => {
    const user = userEvent.setup()
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      error: { message: 'Credenciales incorrectas' },
    })
    render(<Login />)

    await user.type(screen.getByPlaceholderText('tucorreo@ejemplo.com'), 'ana@mail.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'incorrecta')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    expect(await screen.findByText('Credenciales incorrectas')).toBeInTheDocument()
  })

  it('solicita autenticación de Google desde Login', async () => {
    const user = userEvent.setup()
    render(<Login />)

    await user.click(screen.getByRole('button', { name: /Continuar con Google/ }))

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' }),
    )
  })

  it('registra un usuario y muestra la confirmación por correo', async () => {
    const user = userEvent.setup()
    render(<Register />)

    await user.type(screen.getByPlaceholderText('Tu nombre'), 'Ana')
    await user.type(screen.getByPlaceholderText('tucorreo@ejemplo.com'), 'ana@mail.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'secreto123')
    await user.click(screen.getByRole('button', { name: 'Registrarme' }))

    expect(await screen.findByText(/Te enviamos un link de confirmación/)).toBeInTheDocument()
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'ana@mail.com',
      password: 'secreto123',
      options: { data: { nombre: 'Ana' } },
    })
  })

  it('muestra el error devuelto al registrar la cuenta', async () => {
    const user = userEvent.setup()
    supabase.auth.signUp.mockResolvedValueOnce({
      error: { message: 'El correo ya está registrado' },
    })
    render(<Register />)

    await user.type(screen.getByPlaceholderText('Tu nombre'), 'Ana')
    await user.type(screen.getByPlaceholderText('tucorreo@ejemplo.com'), 'ana@mail.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'secreto123')
    await user.click(screen.getByRole('button', { name: 'Registrarme' }))

    expect(await screen.findByText('El correo ya está registrado')).toBeInTheDocument()
  })
})