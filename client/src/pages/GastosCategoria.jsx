import { useEffect, useState } from 'react';
import { listarGastos, crearGasto, editarGasto, eliminarGasto } from '../services/gastos';
import { listarCuentas } from '../services/ingresos';
import { useCategorias } from '../context/useCategorias';
import '../styles/movimientos.css';

const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
const OPCION_NUEVA = '__nueva__';

function formatoPesos(numero) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(numero);
}

export default function GastosCategoria({ categoriaId }) {
  const { categorias, buscarPorNombre, crear: crearCategoria } = useCategorias();
  const categoriaActual = categorias.find((c) => c.id === categoriaId);

  const [gastos, setGastos] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const [monto, setMonto] = useState('');
  const [cuentaId, setCuentaId] = useState('');
  const [categoriaSeleccion, setCategoriaSeleccion] = useState(categoriaId);
  const [nombreNuevaCategoria, setNombreNuevaCategoria] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(hoy);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [idAEliminar, setIdAEliminar] = useState(null);

  async function cargarDatos() {
    try {
      const [listaGastos, listaCuentas] = await Promise.all([listarGastos(), listarCuentas()]);
      setGastos(listaGastos.filter((g) => g.categoria?.id === categoriaId));
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
        setGastos(listaGastos.filter((g) => g.categoria?.id === categoriaId));
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
}, [categoriaId]);

  function limpiarFormulario() {
    setEditandoId(null);
    setMonto('');
    setCuentaId('');
    setCategoriaSeleccion(categoriaId);
    setNombreNuevaCategoria('');
    setDescripcion('');
    setFecha(hoy);
  }

  function comenzarEdicion(gasto) {
    setEditandoId(gasto.id);
    setMonto(String(gasto.monto));
    setCuentaId(gasto.cuenta?.id || '');
    setCategoriaSeleccion(gasto.categoria?.id || categoriaId);
    setDescripcion(gasto.descripcion || '');
    setFecha(gasto.fecha);
    setError('');
  }


  async function resolverCategoria() {
    if (categoriaSeleccion !== OPCION_NUEVA) {
      return { id: categoriaSeleccion, mensaje: '' };
    }
    const existente = buscarPorNombre(nombreNuevaCategoria);
    if (existente) {
      return { id: existente.id, mensaje: `Ya tenías «${existente.nombre}», se usó esa en vez de crear una nueva` };
    }
    const nueva = await crearCategoria(nombreNuevaCategoria);
    return { id: nueva.id, mensaje: '' };
  }

  async function manejarSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      const { id: categoriaFinalId, mensaje } = await resolverCategoria();
      const datos = { monto, cuentaId, categoriaId: categoriaFinalId, descripcion, fecha };

      if (editandoId) {
        await editarGasto(editandoId, datos);
      } else {
        await crearGasto(datos);
      }

      setAviso(mensaje || (categoriaFinalId !== categoriaId ? 'Gasto guardado en otra categoría' : ''));
      limpiarFormulario();
      await cargarDatos();
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
      if (editandoId === id) limpiarFormulario();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="pagina">
      <div className="pagina-header">
        <h1>{categoriaActual?.nombre || 'Categoría'}</h1>
        <p>Gastos registrados en esta categoría</p>
      </div>

      <div className="tarjeta">
        <h2>{editandoId ? 'Editar gasto' : 'Nuevo gasto'}</h2>
        <form onSubmit={manejarSubmit} className="formulario-grid">
          <div>
            <label htmlFor="monto">Monto</label>
            <input
              id="monto"
              type="number"
              placeholder="Ej. 45000"
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
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
              <option value={OPCION_NUEVA}>＋ Crear nueva categoría…</option>
            </select>
          </div>
          {categoriaSeleccion === OPCION_NUEVA && (
            <div>
              <label htmlFor="nueva-categoria">Nombre de la categoría</label>
              <input
                id="nueva-categoria"
                type="text"
                placeholder="Ej. Salud"
                value={nombreNuevaCategoria}
                onChange={(e) => setNombreNuevaCategoria(e.target.value)}
                maxLength={40}
                required
              />
            </div>
          )}
          <div className="campo-ancho">
            <label htmlFor="descripcion">Descripción (opcional)</label>
            <input
              id="descripcion"
              type="text"
              placeholder="Ej. Cine con amigos"
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
              {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Agregar gasto'}
            </button>
            {editandoId && (
              <button type="button" className="boton boton-secundario" onClick={limpiarFormulario}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {aviso && <p className="mensaje-aviso">{aviso}</p>}
      {error && <p className="mensaje-error">{error}</p>}

      <div className="tarjeta">
        <h2>Gastos en esta categoría</h2>
        {cargando ? (
          <p className="estado-cargando">Cargando...</p>
        ) : gastos.length === 0 ? (
          <p className="estado-vacio">Todavía no hay gastos en esta categoría.</p>
        ) : (
          <ul className="lista-movimientos">
            {gastos.map((g) => (
              <li key={g.id} className="movimiento-fila">
                <span className="movimiento-icono movimiento-icono--gasto">↓</span>
                <div className="movimiento-info">
                  <div className="movimiento-descripcion">{g.descripcion || 'Sin descripción'}</div>
                  <div className="movimiento-meta">
                    <span className="pill">{g.cuenta?.nombre}</span>
                    <span>{g.fecha}</span>
                  </div>
                </div>
                <span className="movimiento-monto movimiento-monto--negativo">- {formatoPesos(g.monto)}</span>
                <div className="movimiento-acciones">
                  <button className="icon-btn" onClick={() => comenzarEdicion(g)} aria-label="Editar">✏️</button>
                  <button className="icon-btn" onClick={() => pedirEliminar(g.id)} aria-label="Eliminar">🗑️</button>
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