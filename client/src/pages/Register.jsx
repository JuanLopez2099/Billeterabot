import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function Register() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre: nombre,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setCargando(false);
      return;
    }

    console.log('Usuario creado en Supabase Auth (sin confirmar aún):', data.user);

    setRegistroExitoso(true);
    setCargando(false);
  }

  if (registroExitoso) {
    return (
      <div>
        <h1>¡Revisa tu correo!</h1>
        <p>Te enviamos un link de confirmación a {email}. Haz clic ahí para activar tu cuenta.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Crear cuenta</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <input
        type="text"
        placeholder="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
      />
      <button type="submit" disabled={cargando}>
        {cargando ? 'Creando...' : 'Registrarme'}
      </button>
    </form>
  );
}

export default Register;