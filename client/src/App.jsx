import { useState } from 'react';
import { useAuth } from './context/useAuth';
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Ingresos from './pages/Ingresos';

function App() {
  const { user, loading, signOut, recoveryMode } = useAuth();
  const [vista, setVista] = useState('login');

  if (loading) return <p>Cargando...</p>;

  if (recoveryMode) {
    return <ResetPassword />;
  }

  if (user) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 16 }}>
          <button onClick={signOut}>Cerrar sesión</button>
        </div>
        <Ingresos />
      </div>
    );
  }

  if (vista === 'forgot') {
    return <ForgotPassword onVolver={() => setVista('login')} />;
  }

  if (vista === 'register') {
    return <Register onIrALogin={() => setVista('login')} />;
  }

  return (
    <Login
      onOlvidoPassword={() => setVista('forgot')}
      onIrARegistro={() => setVista('register')}
    />
  );
}

export default App;