import { useState } from 'react';
import { useAuth } from './context/useAuth';
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Ingresos from './pages/Ingresos';
import Topbar from './components/Topbar';
import './styles/topbar.css';
import NavTabs from './components/NavTabs';
import Transferencias from './pages/Transferencias';
import Categorias from './pages/Categorias';
import { CategoriasProvider } from './context/CategoriasProvider';

function App() {
  const { user, loading, signOut, recoveryMode, nombre, sincronizado } = useAuth();
  const [vista, setVista] = useState('login');
  const [pantalla, setPantalla] = useState('ingresos');

  if (loading) return <p>Cargando...</p>;

  if (recoveryMode) {
    return <ResetPassword />;
  }

  if (user && !sincronizado) return <p>Cargando...</p>;

  if (user) {
    return (
      <CategoriasProvider>
        <div>
          <Topbar nombre={nombre} onCerrarSesion={signOut} />
          <NavTabs pantalla={pantalla} onCambiar={setPantalla} />
          {pantalla === 'ingresos' && <Ingresos />}
          {pantalla === 'transferencias' && <Transferencias />}
          {pantalla === 'categorias' && <Categorias />}
        </div>
      </CategoriasProvider>
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