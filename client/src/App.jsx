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

function App() {
  const { user, loading, signOut, recoveryMode, nombre } = useAuth();
  const [vista, setVista] = useState('login');
  const [pantalla, setPantalla] = useState('ingresos');

  if (loading) return <p>Cargando...</p>;

  if (recoveryMode) {
    return <ResetPassword />;
  }

  if (user) {
    return (
      <div>
        <Topbar nombre={nombre} onCerrarSesion={signOut} />
        <NavTabs pantalla={pantalla} onCambiar={setPantalla} />
        {pantalla === 'ingresos' ? <Ingresos /> : <Transferencias />}
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