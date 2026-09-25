import { useEffect, useState } from 'react';
import { listarIngresos, crearIngreso, editarIngreso,  eliminarIngreso, listarCuentas } from '../services/ingresos';
import '../styles/ingresos.css';

const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

function formatoPesos(numero) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(numero);
}

export default function Ingresos() {
  const [ingresos, setIngresos] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [monto, setMonto] = useState('');
  const [cuentaId, setCuentaId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(hoy);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState(null); // null = creando uno nuevo

  async function cargarDatos() {
    try {
      const [listaIngresos, listaCuentas] = await Promise.all([
        listarIngresos(),
        listarCuentas(),
      ]);
      setIngresos(listaIngresos);
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
        const [listaIngresos, listaCuentas] = await Promise.all([
          listarIngresos(),
          listarCuentas(),
        ]);
        if (activo) {
          setIngresos(listaIngresos);
          setCuentas(listaCuentas);
          setError('');
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

  function limpiarFormulario() {
    setEditandoId(null);
    setMonto('');
    setCuentaId('');
    setDescripcion('');
    setFecha(hoy);
  }

  function comenzarEdicion(ingreso) {
    setEditandoId(ingreso.id);
    setMonto(String(ingreso.monto));
    setCuentaId(ingreso.cuenta?.id || '');
    setDescripcion(ingreso.descripcion || '');
    setFecha(ingreso.fecha);
    setError('');
  }

  async function manejarSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editandoId) {
        await editarIngreso(editandoId, { monto, cuentaId, descripcion, fecha });
      } else {
        await crearIngreso({ monto, cuentaId, descripcion, fecha });
      }
      limpiarFormulario();
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function manejarEliminar(id) {
    if (!confirm('¿Eliminar este ingreso?')) return;
    try {
      await eliminarIngreso(id);
      if (editandoId === id) limpiarFormulario();
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="ingresos-page">
      <div className="ingresos-header">
        <h1>Ingresos</h1>
        <p>Registra y revisa el dinero que has recibido</p>
      </div>

      <div className="tarjeta">
        <h2>{editandoId ? 'Editar ingreso' : 'Nuevo ingreso'}</h2>
        <form onSubmit={manejarSubmit} className="formulario-ingreso">
          <div>
            <label htmlFor="monto">Monto</label>
            <input
              id="monto"
              type="number"
              placeholder="Ej. 500000"
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
          <div className="campo-ancho">
            <label htmlFor="descripcion">Descripción (opcional)</label>
            <input
              id="descripcion"
              type="text"
              placeholder="Ej. Pago quincena"
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
              {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Agregar ingreso'}
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
        <h2>Tus ingresos</h2>
        {cargando ? (
          <p className="estado-cargando">Cargando...</p>
        ) : ingresos.length === 0 ? (
          <p className="estado-vacio">Todavía no has registrado ningún ingreso.</p>
        ) : (
          <ul className="lista-movimientos">
            {ingresos.map((ing) => (
              <li key={ing.id} className="movimiento-fila">
                <span className="movimiento-icono">↑</span>
                <div className="movimiento-info">
                  <div className="movimiento-descripcion">
                    {ing.descripcion || 'Sin descripción'}
                  </div>
                  <div className="movimiento-meta">
                    <span className="pill">{ing.cuenta?.nombre}</span>
                    <span>{ing.fecha}</span>
                  </div>
                </div>
                <span className="movimiento-monto">+ {formatoPesos(ing.monto)}</span>
                <div className="movimiento-acciones">
                  <button className="icon-btn" onClick={() => comenzarEdicion(ing)} aria-label="Editar">✏️</button>
                  <button className="icon-btn" onClick={() => manejarEliminar(ing.id)} aria-label="Eliminar">🗑️</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}