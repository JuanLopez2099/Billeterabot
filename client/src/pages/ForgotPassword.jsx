import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import AuthLayout from '../components/AuthLayout';

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
      <AuthLayout titulo="Revisa tu correo">
        <p className="auth-subtitle">
          Si {email} está registrado, te enviamos un link para restablecer tu contraseña.
        </p>
        <button className="auth-button-primary" onClick={onVolver}>
          Volver a iniciar sesión
        </button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {error && <p className="auth-error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <label className="auth-label">Correo</label>
          <input
            className="auth-input"
            type="email"
            placeholder="tucorreo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <button className="auth-button-primary" type="submit" disabled={cargando}>
          {cargando ? 'Enviando...' : 'Enviar link de recuperación'}
        </button>
      </form>

      <div className="auth-link-row">
        <button className="auth-link" onClick={onVolver}>Volver</button>
      </div>
    </AuthLayout>
  );
}

export default ForgotPassword;