import { useAuth } from './context/useAuth';
import Register from './pages/Register';

function App() {
  const { user, loading, signOut } = useAuth();

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

  return <Register />;
}

export default App;