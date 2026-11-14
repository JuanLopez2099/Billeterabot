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
import Ingresos from './pages/Ingresos';
import SinCategoriaGastos from './pages/SinCategoriaGastos';
import { CuentasProvider } from './context/CuentasProvider';
import Cuentas from './pages/Cuentas';
import VincularTelegram from './components/VincularTelegram';
import { useEsMovil } from './utils/useEsMovil';

function App() {
  const { user, loading, signOut, recoveryMode, nombre, sincronizado } = useAuth();
  const [vista, setVista] = useState('login');
  const [pantalla, setPantalla] = useState('general');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const esMovil = useEsMovil();

  function cambiarPantalla(nueva) {
    setPantalla(nueva);
    setMenuAbierto(false);
  }

  if (loading) return <p>Cargando...</p>;

  if (recoveryMode) {
    return <ResetPassword />;
  }

  if (user && !sincronizado) return <p>Cargando...</p>;

  if (user) {
    return (
      <CategoriasProvider>
        <CuentasProvider>
          <div>
            <Topbar
              nombre={nombre}
              onCerrarSesion={signOut}
              esMovil={esMovil}
              menuAbierto={menuAbierto}
              onToggleMenu={() => setMenuAbierto((abierto) => !abierto)}
            />
            <div className="layout-con-sidebar">
              <div className={`menu-movil ${menuAbierto ? 'menu-movil--abierto' : ''}`}>
                {esMovil && nombre && <div className="menu-movil-usuario">{nombre}</div>}
                <Sidebar pantalla={pantalla} onCambiar={cambiarPantalla} />
                {esMovil && (
                  <div className="menu-movil-acciones">
                    <VincularTelegram />
                    <button className="boton boton-secundario" onClick={signOut}>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
              <div className={menuAbierto ? 'contenido--oculto' : ''} style={{ flex: 1 }}>
                {pantalla === 'general' && <General />}
                {pantalla === 'ingresos' && <Ingresos />}
                {pantalla === 'transferencias' && <Transferencias />}
                {pantalla === 'cuentas' && <Cuentas />}
                {pantalla.startsWith('categoria:') && (
                  <GastosCategoria
                    key={pantalla}
                    categoriaId={pantalla.split(':')[1]}
                    onCambiarPantalla={setPantalla}
                  />
                )}
                {pantalla === 'sin-categoria' && (
                  <SinCategoriaGastos onCambiarPantalla={setPantalla} />
                )}
              </div>
            </div>
          </div>
        </CuentasProvider>
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