import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import AuthLayout from '../components/AuthLayout';
import GoogleIcon from '../components/GoogleIcon';

function Login({ onOlvidoPassword, onIrARegistro }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setCargando(false);
    }
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
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

        <div className="auth-field">
          <label className="auth-label">Contraseña</label>
          <input
            className="auth-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="auth-button-primary" type="submit" disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>

      <div className="auth-link-row">
        <button className="auth-link" onClick={onIrARegistro}>
          ¿No tienes cuenta? Crear cuenta
        </button>
      </div>

      <div className="auth-link-row">
        <button className="auth-link" onClick={onOlvidoPassword}>
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      <div className="auth-divider">o</div>

      <button className="auth-button-google" onClick={handleGoogleLogin}>
        <GoogleIcon />
        <span>Continuar con Google</span>
      </button>
    </AuthLayout>
  );
}

export default Login;