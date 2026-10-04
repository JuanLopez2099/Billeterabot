import { useEffect, useState } from 'react';
import { listarGastos, crearGasto, editarGasto, eliminarGasto } from '../services/gastos';
import { listarCuentas } from '../services/ingresos';
import { useCategorias } from '../context/useCategorias';
import CategoriaCampos from '../components/CategoriaCampos';
import EtiquetaCuenta from '../components/EtiquetaCuenta';
import '../styles/movimientos.css';
import { IconoEditar, IconoEliminar } from '../components/IconosAccion';


const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
const OPCION_NUEVA = '__nueva__';
const OPCION_SIN_CATEGORIA = '__ninguna__';
const NUEVA_CATEGORIA_VACIA = { nombre: '', color: '#7a7a6e', icono: 'otros' };

function formatoPesos(numero) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(numero);
}

const EJEMPLOS_DESCRIPCION = {
  Alimentación: 'Ej. Mercado de la semana',
  Transporte: 'Ej. Pasajes o gasolina',
  Servicios: 'Ej. Factura de internet',
  Ocio: 'Ej. Cine con amigos',
  'Cuidado personal': 'Ej. Corte de cabello',
};

const EJEMPLO_GENERICO = 'Ej. Describe brevemente el gasto';

export default function GastosCategoria({ categoriaId, onCambiarPantalla }) {
  const { categorias, buscarPorNombre, crear: crearCategoria } = useCategorias();
  const categoriaActual = categorias.find((c) => c.id === categoriaId);

  const [gastos, setGastos] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [monto, setMonto] = useState('');
  const [cuentaId, setCuentaId] = useState('');
  const [categoriaSeleccion, setCategoriaSeleccion] = useState(categoriaId);
  const [nuevaCategoria, setNuevaCategoria] = useState(NUEVA_CATEGORIA_VACIA);
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(hoy);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [idAEliminar, setIdAEliminar] = useState(null);

  const categoriaSeleccionada = categorias.find((c) => c.id === categoriaSeleccion);
  const ejemploDescripcion = categoriaSeleccionada?.es_predefinida
    ? EJEMPLOS_DESCRIPCION[categoriaSeleccionada.nombre] || EJEMPLO_GENERICO
    : EJEMPLO_GENERICO;

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
    setNuevaCategoria(NUEVA_CATEGORIA_VACIA);
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
    if (categoriaSeleccion === OPCION_SIN_CATEGORIA) {
      return null;
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
      const datos = { monto, cuentaId, categoriaId: categoriaFinalId, descripcion, fecha };

      if (editandoId) {
        await editarGasto(editandoId, datos);
      } else {
        await crearGasto(datos);
      }

      limpiarFormulario();

      if (categoriaFinalId !== categoriaId) {
        onCambiarPantalla(categoriaFinalId ? `categoria:${categoriaFinalId}` : 'sin-categoria');
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
              <option value={OPCION_SIN_CATEGORIA}>Sin categoría</option>
              <option value={OPCION_NUEVA}>＋ Crear nueva categoría…</option>
            </select>
          </div>

          {categoriaSeleccion === OPCION_NUEVA && (
            <CategoriaCampos
              idPrefix="nueva-categoria"
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
              placeholder={ejemploDescripcion}
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