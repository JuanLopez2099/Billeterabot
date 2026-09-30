import { useState } from 'react';
import { useAuth } from './context/useAuth';
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Topbar from './components/Topbar';
import './styles/topbar.css';
import Transferencias from './pages/Transferencias';
import { CategoriasProvider } from './context/CategoriasProvider';
import Sidebar from './components/Sidebar';
import General from './pages/General';
import './styles/dashboard.css';
import GastosCategoria from './pages/GastosCategoria';

function App() {
  const { user, loading, signOut, recoveryMode, nombre, sincronizado } = useAuth();
  const [vista, setVista] = useState('login');
  const [pantalla, setPantalla] = useState('general');

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
          <div className="layout-con-sidebar">
            <Sidebar pantalla={pantalla} onCambiar={setPantalla} />
            <div style={{ flex: 1 }}>
              {pantalla === 'general' && <General />}
              {pantalla === 'transferencias' && <Transferencias />}
              {pantalla.startsWith('categoria:') && <p style={{ padding: 24 }}>Vista de gastos por categoría (siguiente paso)</p>}
              {pantalla.startsWith('categoria:') && (
                <GastosCategoria key={pantalla} categoriaId={pantalla.split(':')[1]} />
              )}
            </div>
          </div>
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