import { useState } from 'react';
import { useAuth } from './context/useAuth';
import Register from './pages/Register';
import Login from './pages/Login';

function App() {
  const { user, loading, signOut } = useAuth();
  const [mostrarLogin, setMostrarLogin] = useState(false);

  if (loading) return <p>Cargando...</p>;

  if (user) {
    return (
      <div>
        <h1>¡Ya iniciaste sesión!</h1>
        <p>Email: {user.email}</p>
        <button onClick={signOut}>Cerrar sesión</button>
      </div>
    );
  }

  return (
    <div>
      {mostrarLogin ? <Login /> : <Register />}
      <button onClick={() => setMostrarLogin(!mostrarLogin)}>
        {mostrarLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
      </button>
    </div>
  );
}

export default App;