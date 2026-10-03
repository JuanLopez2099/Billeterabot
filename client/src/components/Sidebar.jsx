// client/src/components/Sidebar.jsx
import { useState } from 'react';
import { useCategorias } from '../context/useCategorias';
import CategoriaCampos from './CategoriaCampos';
import { iconoPorClave } from '../utils/categoriaOpciones';
import iconoGeneral from '../assets/iconos/general.svg';
import iconoTransferencias from '../assets/iconos/transferencias.svg';
import iconoIngresos from '../assets/iconos/ingresos.svg';
import { IconoEditar, IconoEliminar } from './IconosAccion';
import { useEffect} from 'react';

const CATEGORIA_VACIA = { nombre: '', color: '#7a7a6e', icono: 'otros' };

export default function Sidebar({ pantalla, onCambiar }) {
  const { categorias, crear, editar, eliminar } = useCategorias();


  const [modalAbierto, setModalAbierto] = useState(null);
  const [campos, setCampos] = useState(CATEGORIA_VACIA);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [idAEliminar, setIdAEliminar] = useState(null);

  function abrirCrear() {
    setCampos(CATEGORIA_VACIA);
    setError('');
    setModalAbierto('crear');
  }

  function abrirEditar(categoria) {
    setCampos({ nombre: categoria.nombre, color: categoria.color, icono: categoria.icono });
    setError('');
    setModalAbierto(categoria.id);
  }

  function cerrarModal() {
    setModalAbierto(null);
    setError('');
  }


  useEffect(() => {
    if (!error || modalAbierto) return;
    const temporizador = setTimeout(() => setError(''), 5000);
    return () => clearTimeout(temporizador);
  }, [error, modalAbierto]);

  async function manejarSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      if (modalAbierto === 'crear') {
        await crear(campos);
      } else {
        await editar(modalAbierto, campos);
      }
      cerrarModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  function manejarEliminar(id) {
    setIdAEliminar(id);
    setError('');
  }

  async function confirmarEliminar() {
    const id = idAEliminar;
    setIdAEliminar(null);
    try {
      await eliminar(id);
      if (pantalla === `categoria:${id}`) onCambiar('general');
    } catch (err) {
      setError(err.message);
    }
  }

  const categoriaAEliminar = categorias.find((c) => c.id === idAEliminar);

  return (
    <aside className="sidebar">
      <button
        className={`sidebar-item ${pantalla === 'general' ? 'sidebar-item--activo' : ''}`}
        onClick={() => onCambiar('general')}
      >
        <img src={iconoGeneral} alt="" className="sidebar-icon" />
        General
      </button>
      <button
        className={`sidebar-item ${pantalla === 'transferencias' ? 'sidebar-item--activo' : ''}`}
        onClick={() => onCambiar('transferencias')}
      >
        <img src={iconoTransferencias} alt="" className="sidebar-icon" />
        Transferencias
      </button>
      <button
        className={`sidebar-item ${pantalla === 'ingresos' ? 'sidebar-item--activo' : ''}`}
        onClick={() => onCambiar('ingresos')}
      >
        <img src={iconoIngresos} alt="" className="sidebar-icon" />
        Ingresos
      </button>

      <div className="sidebar-separador" />

      {categorias.map((c) => {
        const logo = iconoPorClave(c.icono);
        return (
          <div
            key={c.id}
            role="button"
            tabIndex={0}
            onClick={() => onCambiar(`categoria:${c.id}`)}
            onKeyDown={(e) => {
              if (e.target !== e.currentTarget) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onCambiar(`categoria:${c.id}`);
              }
            }}
            className={`sidebar-item sidebar-item--categoria ${
              pantalla === `categoria:${c.id}` ? 'sidebar-item--activo' : ''
            }`}
          >
            <span className="sidebar-item-texto">
              <span className="sidebar-categoria-icono" style={{ backgroundColor: `${c.color}33` }}>
                {logo ? <img src={logo} alt="" /> : c.nombre.charAt(0).toUpperCase()}
              </span>
              {c.nombre}
            </span>

            <span className="sidebar-item-acciones">
              <button
                className="icon-btn"
                aria-label="Editar categoría"
                onClick={(e) => { e.stopPropagation(); abrirEditar(c); }}
              >
                <IconoEditar />
              </button>
              <button
                className="icon-btn"
                aria-label="Eliminar categoría"
                onClick={(e) => { e.stopPropagation(); manejarEliminar(c.id); }}
              >
                <IconoEliminar />
              </button>
            </span>
          </div>
        );
      })}

      <button className="sidebar-item sidebar-item--nueva" onClick={abrirCrear}>
        ＋ Nueva categoría
      </button>

      {error && !modalAbierto && <p className="sidebar-error">{error}</p>}

      {modalAbierto && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-tarjeta modal-tarjeta--ancha" onClick={(e) => e.stopPropagation()}>
            <h3>{modalAbierto === 'crear' ? 'Nueva categoría' : 'Editar categoría'}</h3>
            <form onSubmit={manejarSubmit} className="formulario-grid">
              <CategoriaCampos
                nombre={campos.nombre}
                onNombreChange={(nombre) => setCampos((c) => ({ ...c, nombre }))}
                color={campos.color}
                onColorChange={(color) => setCampos((c) => ({ ...c, color }))}
                icono={campos.icono}
                onIconoChange={(icono) => setCampos((c) => ({ ...c, icono }))}
              />
              {error && <p className="mensaje-error campo-ancho">{error}</p>}
              <div className="formulario-acciones campo-ancho">
                <button type="submit" className="boton boton-primario" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" className="boton boton-secundario" onClick={cerrarModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {idAEliminar && (
        <div className="modal-overlay" onClick={() => setIdAEliminar(null)}>
          <div className="modal-tarjeta" onClick={(e) => e.stopPropagation()}>
            <h3>Eliminar categoría</h3>
            <p>
              ¿Seguro que quieres eliminar «{categoriaAEliminar?.nombre}»? Sus gastos quedarán
              sin categoría y esta acción no se puede deshacer.
            </p>
            <div className="modal-acciones">
              <button className="boton boton-secundario" onClick={() => setIdAEliminar(null)}>Cancelar</button>
              <button className="boton boton-peligro" onClick={confirmarEliminar}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}