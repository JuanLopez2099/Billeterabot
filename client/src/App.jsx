import { useState } from 'react';
import { useAuth } from './context/useAuth';
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

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
        <h1>¡Ya iniciaste sesión!</h1>
        <p>Email: {user.email}</p>
        <button onClick={signOut}>Cerrar sesión</button>
      </div>
    );
  }

  if (vista === 'forgot') {
    return <ForgotPassword onVolver={() => setVista('login')} />;
  }

  return (
    <div>
      {vista === 'login' ? (
        <Login onOlvidoPassword={() => setVista('forgot')} />
      ) : (
        <Register />
      )}
      <button onClick={() => setVista(vista === 'login' ? 'register' : 'login')}>
        {vista === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
      </button>
    </div>
  );
}

export default App;