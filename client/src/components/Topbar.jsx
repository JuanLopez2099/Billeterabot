// client/src/components/Topbar.jsx
export default function Topbar({ nombre, onCerrarSesion }) {
  return (
    <header className="topbar">
      <div className="topbar-marca">
        <span className="topbar-logo">B</span>
        <span className="topbar-nombre-app">Billeterabot</span>
      </div>
      <div className="topbar-usuario">
        {nombre && <span className="topbar-nombre-usuario">{nombre}</span>}
        <button className="boton boton-secundario" onClick={onCerrarSesion}>
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}