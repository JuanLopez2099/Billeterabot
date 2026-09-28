import { useState } from 'react';
import { useCategorias } from '../context/useCategorias';
import '../styles/movimientos.css';

export default function Categorias() {
  const {
    categorias,
    cargando,
    error: errorCarga,
    buscarPorNombre,
    crear,
    editar,
    eliminar,
  } = useCategorias();

  const [nombre, setNombre] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [idAEliminar, setIdAEliminar] = useState(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  function limpiarFormulario() {
    setEditandoId(null);
    setNombre('');
  }

  function comenzarEdicion(categoria) {
    setEditandoId(categoria.id);
    setNombre(categoria.nombre);
    setError('');
  }

  async function manejarSubmit(e) {
    e.preventDefault();
    setError('');

    // Aviso inmediato si el nombre ya existe (el servidor lo vuelve a validar)
    const existente = buscarPorNombre(nombre);
    if (existente && existente.id !== editandoId) {
      setError(`Ya tienes una categoría llamada «${existente.nombre}»`);
      return;
    }

    setGuardando(true);
    try {
      if (editandoId) {
        await editar(editandoId, nombre);
      } else {
        await crear(nombre);
      }
      limpiarFormulario();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminar() {
    const id = idAEliminar;
    setIdAEliminar(null);
    try {
      await eliminar(id);
      if (editandoId === id) limpiarFormulario();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="pagina">
      <div className="pagina-header">
        <h1>Categorías</h1>
        <p>Organiza tus gastos como te haga más sentido</p>
      </div>

      <div className="tarjeta">
        <h2>{editandoId ? 'Editar categoría' : 'Nueva categoría'}</h2>
        <form onSubmit={manejarSubmit} className="formulario-grid">
          <div className="campo-ancho">
            <label htmlFor="nombre-categoria">Nombre</label>
            <input
              id="nombre-categoria"
              type="text"
              placeholder="Ej. Salud"
              maxLength={40}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div className="formulario-acciones">
            <button type="submit" className="boton boton-primario" disabled={guardando}>
              {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Agregar categoría'}
            </button>
            {editandoId && (
              <button type="button" className="boton boton-secundario" onClick={limpiarFormulario}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {(error || errorCarga) && <p className="mensaje-error">{error || errorCarga}</p>}

      <div className="tarjeta">
        <h2>Tus categorías</h2>
        {cargando ? (
          <p className="estado-cargando">Cargando...</p>
        ) : categorias.length === 0 ? (
          <p className="estado-vacio">Todavía no tienes categorías. Crea la primera arriba.</p>
        ) : (
          <ul className="lista-movimientos">
            {categorias.map((c) => (
              <li key={c.id} className="movimiento-fila">
                <span className="movimiento-icono">🏷️</span>
                <div className="movimiento-info">
                  <div className="movimiento-descripcion">{c.nombre}</div>
                  {c.es_predefinida && (
                    <div className="movimiento-meta">
                      <span className="pill">Predefinida</span>
                    </div>
                  )}
                </div>
                <div className="movimiento-acciones">
                  <button className="icon-btn" onClick={() => comenzarEdicion(c)} aria-label="Editar">✏️</button>
                  <button className="icon-btn" onClick={() => setIdAEliminar(c.id)} aria-label="Eliminar">🗑️</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {idAEliminar && (
        <div className="modal-overlay" onClick={() => setIdAEliminar(null)}>
          <div className="modal-tarjeta" onClick={(e) => e.stopPropagation()}>
            <h3>Eliminar categoría</h3>
            <p>Los gastos de esta categoría no se borran: quedarán sin categoría.</p>
            <div className="modal-acciones">
              <button className="boton boton-secundario" onClick={() => setIdAEliminar(null)}>Cancelar</button>
              <button className="boton boton-peligro" onClick={confirmarEliminar}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}