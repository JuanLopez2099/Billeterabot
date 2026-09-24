// ResetPassword.jsx
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/useAuth';
import AuthLayout from '../components/AuthLayout';

function ResetPassword() {
  const { salirDeRecoveryMode, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setCargando(false);
      return;
    }

    salirDeRecoveryMode();
    await signOut();
  }

  return (
    <AuthLayout titulo="Nueva contraseña" subtitulo="Define una nueva contraseña para tu cuenta">
      {error && <p className="auth-error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <label className="auth-label">Nueva contraseña</label>
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
          {cargando ? 'Guardando...' : 'Guardar nueva contraseña'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default ResetPassword;