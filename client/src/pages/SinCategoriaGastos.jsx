import { useEffect, useState } from 'react';
import { listarGastos, editarGasto, eliminarGasto } from '../services/gastos';
import { listarCuentas } from '../services/ingresos';
import { useCategorias } from '../context/useCategorias';
import CategoriaCampos from '../components/CategoriaCampos';
import EtiquetaCuenta from '../components/EtiquetaCuenta';
import '../styles/movimientos.css';
import { IconoEditar, IconoEliminar } from '../components/IconosAccion';

const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
const OPCION_NUEVA = '__nueva__';
const NUEVA_CATEGORIA_VACIA = { nombre: '', color: '#7a7a6e', icono: 'otros' };

function formatoPesos(numero) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(numero);
}

export default function SinCategoriaGastos({ onCambiarPantalla }) {
  const { categorias, buscarPorNombre, crear: crearCategoria } = useCategorias();

  const [gastos, setGastos] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [editandoId, setEditandoId] = useState(null);
  const [monto, setMonto] = useState('');
  const [cuentaId, setCuentaId] = useState('');
  const [categoriaSeleccion, setCategoriaSeleccion] = useState(OPCION_NUEVA);
  const [nuevaCategoria, setNuevaCategoria] = useState(NUEVA_CATEGORIA_VACIA);
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(hoy);
  const [guardando, setGuardando] = useState(false);
  const [idAEliminar, setIdAEliminar] = useState(null);

  async function cargarDatos() {
    try {
      const [listaGastos, listaCuentas] = await Promise.all([listarGastos(), listarCuentas()]);
      setGastos(listaGastos.filter((g) => !g.categoria));
      setCuentas(listaCuentas);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const [listaGastos, listaCuentas] = await Promise.all([listarGastos(), listarCuentas()]);
        if (activo) {
          setGastos(listaGastos.filter((g) => !g.categoria));
          setCuentas(listaCuentas);
        }
      } catch (err) {
        if (activo) setError(err.message);
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();
    return () => { activo = false; };
  }, []);

  function cerrarEdicion() {
    setEditandoId(null);
    setMonto('');
    setCuentaId('');
    setCategoriaSeleccion(OPCION_NUEVA);
    setNuevaCategoria(NUEVA_CATEGORIA_VACIA);
    setDescripcion('');
    setFecha(hoy);
  }

  function comenzarEdicion(gasto) {
    setEditandoId(gasto.id);
    setMonto(String(gasto.monto));
    setCuentaId(gasto.cuenta?.id || '');
    setCategoriaSeleccion(OPCION_NUEVA); // este gasto ya está sin categoría
    setDescripcion(gasto.descripcion || '');
    setFecha(gasto.fecha);
    setError('');
  }

  async function resolverCategoria() {
    if (categoriaSeleccion === OPCION_NUEVA && !nuevaCategoria.nombre) {
      return null; // se queda sin categoría
    }
    if (categoriaSeleccion !== OPCION_NUEVA) {
      return categoriaSeleccion;
    }
    const existente = buscarPorNombre(nuevaCategoria.nombre);
    if (existente) {
      return existente.id;
    }
    const nueva = await crearCategoria(nuevaCategoria);
    return nueva.id;
  }

  async function manejarSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      const categoriaFinalId = await resolverCategoria();
      await editarGasto(editandoId, { monto, cuentaId, categoriaId: categoriaFinalId, descripcion, fecha });
      cerrarEdicion();

      if (categoriaFinalId) {
        onCambiarPantalla(`categoria:${categoriaFinalId}`);
      } else {
        await cargarDatos();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  function pedirEliminar(id) {
    setIdAEliminar(id);
  }

  async function confirmarEliminar() {
    const id = idAEliminar;
    setIdAEliminar(null);
    try {
      await eliminarGasto(id);
      setGastos((actuales) => actuales.filter((g) => g.id !== id));
      if (editandoId === id) cerrarEdicion();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="pagina">
      <div className="pagina-header">
        <h1>Sin categoría</h1>
        <p>Gastos que no tienen una categoría asignada</p>
      </div>

      {editandoId && (
        <div className="tarjeta">
          <h2>Editar gasto</h2>
          <form onSubmit={manejarSubmit} className="formulario-grid">
            <div>
              <label htmlFor="monto">Monto</label>
              <input
                id="monto"
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="cuenta">Cuenta</label>
              <select id="cuenta" value={cuentaId} onChange={(e) => setCuentaId(e.target.value)} required>
                <option value="">Selecciona una cuenta</option>
                {cuentas.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="categoria">Categoría</label>
              <select
                id="categoria"
                value={categoriaSeleccion}
                onChange={(e) => setCategoriaSeleccion(e.target.value)}
              >
                <option value={OPCION_NUEVA}>Sin categoría / crear nueva</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            {categoriaSeleccion === OPCION_NUEVA && (
              <CategoriaCampos
                idPrefix="categoria-sin-cat"
                nombre={nuevaCategoria.nombre}
                onNombreChange={(nombre) => setNuevaCategoria((c) => ({ ...c, nombre }))}
                color={nuevaCategoria.color}
                onColorChange={(color) => setNuevaCategoria((c) => ({ ...c, color }))}
                icono={nuevaCategoria.icono}
                onIconoChange={(icono) => setNuevaCategoria((c) => ({ ...c, icono }))}
              />
            )}

            <div className="campo-ancho">
              <label htmlFor="descripcion">Descripción (opcional)</label>
              <input
                id="descripcion"
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="fecha">Fecha</label>
              <input
                id="fecha"
                type="date"
                value={fecha}
                max={hoy}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
            </div>
            <div className="formulario-acciones">
              <button type="submit" className="boton boton-primario" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button type="button" className="boton boton-secundario" onClick={cerrarEdicion}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {error && <p className="mensaje-error">{error}</p>}

      <div className="tarjeta">
        <h2>Gastos sin categoría</h2>
        {cargando ? (
          <p className="estado-cargando">Cargando...</p>
        ) : gastos.length === 0 ? (
          <p className="estado-vacio">No tienes gastos sin categoría.</p>
        ) : (
          <ul className="lista-movimientos">
            {gastos.map((g) => (
              <li key={g.id} className="movimiento-fila">
                <span className="movimiento-icono movimiento-icono--gasto">↓</span>
                <div className="movimiento-info">
                  <div className="movimiento-descripcion">{g.descripcion || 'Sin descripción'}</div>
                  <div className="movimiento-meta">
                    <EtiquetaCuenta nombre={g.cuenta?.nombre} />
                    <span>{g.fecha}</span>
                  </div>
                </div>
                <span className="movimiento-monto movimiento-monto--negativo">- {formatoPesos(g.monto)}</span>
                <div className="movimiento-acciones">
                  <button className="icon-btn" onClick={() => comenzarEdicion(g)} aria-label="Editar"><IconoEditar /></button>
                  <button className="icon-btn icon-btn--peligro" onClick={() => pedirEliminar(g.id)} aria-label="Eliminar"><IconoEliminar /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {idAEliminar && (
        <div className="modal-overlay" onClick={() => setIdAEliminar(null)}>
          <div className="modal-tarjeta" onClick={(e) => e.stopPropagation()}>
            <h3>Eliminar gasto</h3>
            <p>¿Seguro que quieres eliminarlo? Esta acción no se puede deshacer.</p>
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