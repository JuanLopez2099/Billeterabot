const opciones = [
  { id: 'ingresos', etiqueta: 'Ingresos' },
  { id: 'transferencias', etiqueta: 'Transferencias' },
];


export default function NavTabs({ pantalla, onCambiar }) {
  return (
    <nav className="nav-tabs">
      {opciones.map((op) => (
        <button
          key={op.id}
          className={`nav-tab ${pantalla === op.id ? 'nav-tab--activo' : ''}`}
          onClick={() => onCambiar(op.id)}
        >
          {op.etiqueta}
        </button>
      ))}
    </nav>
  );
}