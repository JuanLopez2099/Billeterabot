import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import AuthLayout from '../components/AuthLayout';
import GoogleIcon from '../components/GoogleIcon';

function Register({ onIrALogin }) {
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

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setCargando(false);
      return;
    }

    setRegistroExitoso(true);
    setCargando(false);
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }

  if (registroExitoso) {
    return (
      <AuthLayout titulo="¡Revisa tu correo!">
        <p className="auth-subtitle">
          Te enviamos un link de confirmación a {email}. Haz clic ahí para activar tu cuenta.
        </p>
        <button className="auth-button-primary" onClick={onIrALogin}>
          Volver a iniciar sesión
        </button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout titulo="Crear cuenta" subtitulo="Regístrate para empezar a controlar tus gastos">
      {error && <p className="auth-error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <label className="auth-label">Nombre</label>
          <input
            className="auth-input"
            type="text"
            placeholder="Tu nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>

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
            minLength={6}
          />
        </div>

        <button className="auth-button-primary" type="submit" disabled={cargando}>
          {cargando ? 'Creando...' : 'Registrarme'}
        </button>
      </form>

      <div className="auth-link-row">
        <button className="auth-link" onClick={onIrALogin}>
          ¿Ya tienes cuenta? Inicia sesión
        </button>
      </div>

      <div className="auth-divider">o</div>

      <button className="auth-button-google" onClick={handleGoogleLogin}>
        <GoogleIcon />
        Registrarme con Google
      </button>
    </AuthLayout>
  );
}

export default Register;