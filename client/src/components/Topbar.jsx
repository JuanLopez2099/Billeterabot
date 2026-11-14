import VincularTelegram from './VincularTelegram';

export default function Topbar({ nombre, onCerrarSesion, esMovil, menuAbierto, onToggleMenu }) {
  return (
    <header className="topbar">
      <div className="topbar-marca">
        <span className="topbar-logo">B</span>
        <span className="topbar-nombre-app">Billeterabot</span>
      </div>

      {esMovil ? (
        <button
          className="topbar-hamburguesa"
          onClick={onToggleMenu}
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuAbierto}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {menuAbierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      ) : (
        <div className="topbar-usuario">
          {nombre && <span className="topbar-nombre-usuario">{nombre}</span>}
          <VincularTelegram />
          <button className="boton boton-secundario" onClick={onCerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      )}
    </header>
  );
}