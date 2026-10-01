import { useState } from 'react';
import { useCategorias } from '../context/useCategorias';

export default function Sidebar({ pantalla, onCambiar }) {
  const { categorias, crear, editar, eliminar } = useCategorias();

  const [creandoNueva, setCreandoNueva] = useState(false);
  const [nombreNueva, setNombreNueva] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [error, setError] = useState('');

  async function manejarCrear(e) {
    e.preventDefault();
    try {
      await crear(nombreNueva);
      setNombreNueva('');
      setCreandoNueva(false);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarEditar(e) {
    e.preventDefault();
    try {
      await editar(editandoId, nombreEditado);
      setEditandoId(null);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarEliminar(id) {
    if (!confirm('¿Eliminar esta categoría? Sus gastos quedarán sin categoría.')) return;
    try {
      await eliminar(id);
      if (pantalla === `categoria:${id}`) onCambiar('general');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <aside className="sidebar">
      <button
        className={`sidebar-item ${pantalla === 'general' ? 'sidebar-item--activo' : ''}`}
        onClick={() => onCambiar('general')}
      >
        🏠 General
      </button>
      <button
        className={`sidebar-item ${pantalla === 'transferencias' ? 'sidebar-item--activo' : ''}`}
        onClick={() => onCambiar('transferencias')}
      >
        🔁 Transferencias
      </button>
      <button
        className={`sidebar-item ${pantalla === 'ingresos' ? 'sidebar-item--activo' : ''}`}
        onClick={() => onCambiar('ingresos')}
      >
        💰 Ingresos
      </button>

      <div className="sidebar-separador" />

      {categorias.map((c) =>
        editandoId === c.id ? (
          <form key={c.id} onSubmit={manejarEditar} className="sidebar-form-inline">
            <input
              autoFocus
              value={nombreEditado}
              onChange={(e) => setNombreEditado(e.target.value)}
              maxLength={40}
            />
            <button type="submit" className="icon-btn" aria-label="Guardar">✔️</button>
            <button type="button" className="icon-btn" onClick={() => setEditandoId(null)} aria-label="Cancelar">✕</button>
          </form>
        ) : (
          <div
            key={c.id}
            className={`sidebar-item sidebar-item--categoria ${pantalla === `categoria:${c.id}` ? 'sidebar-item--activo' : ''}`}
          >
            <span className="sidebar-item-texto" onClick={() => onCambiar(`categoria:${c.id}`)}>
              🏷️ {c.nombre}
            </span>
            <span className="sidebar-item-acciones">
              <button
                className="icon-btn"
                aria-label="Editar categoría"
                onClick={() => { setEditandoId(c.id); setNombreEditado(c.nombre); }}
              >
                ✏️
              </button>
              <button className="icon-btn" aria-label="Eliminar categoría" onClick={() => manejarEliminar(c.id)}>🗑️</button>
            </span>
          </div>
        )
      )}

      {creandoNueva ? (
        <form onSubmit={manejarCrear} className="sidebar-form-inline">
          <input
            autoFocus
            placeholder="Nombre"
            value={nombreNueva}
            onChange={(e) => setNombreNueva(e.target.value)}
            maxLength={40}
          />
          <button type="submit" className="icon-btn" aria-label="Guardar">✔️</button>
          <button type="button" className="icon-btn" onClick={() => setCreandoNueva(false)} aria-label="Cancelar">✕</button>
        </form>
      ) : (
        <button className="sidebar-item sidebar-item--nueva" onClick={() => setCreandoNueva(true)}>
          ＋ Nueva categoría
        </button>
      )}

      {error && <p className="sidebar-error">{error}</p>}
    </aside>
  );
}
