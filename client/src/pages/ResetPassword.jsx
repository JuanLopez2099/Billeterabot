import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/useAuth';

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
    <form onSubmit={handleSubmit}>
      <h1>Nueva contraseña</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <input
        type="password"
        placeholder="Nueva contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
      />
      <button type="submit" disabled={cargando}>
        {cargando ? 'Guardando...' : 'Guardar nueva contraseña'}
      </button>
    </form>
  );
}

export default ResetPassword;