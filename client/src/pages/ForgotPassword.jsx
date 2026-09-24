import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function ForgotPassword({ onVolver }) {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: window.location.origin }
    );

    if (resetError) {
      setError(resetError.message);
      setCargando(false);
      return;
    }

    setEnviado(true);
    setCargando(false);
  }

  if (enviado) {
    return (
      <div>
        <h1>Revisa tu correo</h1>
        <p>Si {email} está registrado, te enviamos un link para restablecer tu contraseña.</p>
        <button onClick={onVolver}>Volver a iniciar sesión</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Recuperar contraseña</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <input
        type="email"
        placeholder="Correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit" disabled={cargando}>
        {cargando ? 'Enviando...' : 'Enviar link de recuperación'}
      </button>
      <button type="button" onClick={onVolver}>Volver</button>
    </form>
  );
}

export default ForgotPassword;