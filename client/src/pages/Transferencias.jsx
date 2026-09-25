import { useEffect, useState } from 'react';
import {
  listarTransferencias,
  crearTransferencia,
  editarTransferencia,
  eliminarTransferencia,
} from '../services/transferencias';
import { listarCuentas } from '../services/ingresos'; 
import '../styles/movimientos.css';


const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

function formatoPesos(numero) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(numero);
}

export default function Transferencias() {
  const [transferencias, setTransferencias] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [monto, setMonto] = useState('');
  const [cuentaOrigenId, setCuentaOrigenId] = useState('');
  const [cuentaDestinoId, setCuentaDestinoId] = useState('');
  const [fecha, setFecha] = useState(hoy);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [idAEliminar, setIdAEliminar] = useState(null);

  async function cargarDatos() {
    try {
      const [listaTransferencias, listaCuentas] = await Promise.all([
        listarTransferencias(),
        listarCuentas(),
      ]);
      setTransferencias(listaTransferencias);
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
        const [listaTransferencias, listaCuentas] = await Promise.all([
          listarTransferencias(),
          listarCuentas(),
        ]);
        if (activo) {
          setTransferencias(listaTransferencias);
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
    setCuentaOrigenId('');
    setCuentaDestinoId('');
    setFecha(hoy);
  }

  function comenzarEdicion(t) {
    setEditandoId(t.id);
    setMonto(String(t.monto));
    setCuentaOrigenId(t.cuenta_origen?.id || '');
    setCuentaDestinoId(t.cuenta_destino?.id || '');
    setFecha(t.fecha);
    setError('');
  }

  async function manejarSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      const datos = { monto, cuentaOrigenId, cuentaDestinoId, fecha };
      if (editandoId) {
        await editarTransferencia(editandoId, datos);
      } else {
        await crearTransferencia(datos);
      }
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
      await eliminarTransferencia(id);
      setTransferencias((actuales) => actuales.filter((t) => t.id !== id));
      if (editandoId === id) limpiarFormulario();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="pagina">
      <div className="pagina-header">
        <h1>Transferencias</h1>
        <p>Lleva el registro del dinero que mueves entre tus cuentas</p>
      </div>

      <div className="tarjeta">
        <h2>{editandoId ? 'Editar transferencia' : 'Nueva transferencia'}</h2>
        <form onSubmit={manejarSubmit} className="formulario-grid">
          <div>
            <label htmlFor="monto">Monto</label>
            <input
              id="monto"
              type="number"
              placeholder="Ej. 50000"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
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
          <div>
            <label htmlFor="origen">Desde</label>
            <select id="origen" value={cuentaOrigenId} onChange={(e) => setCuentaOrigenId(e.target.value)} required>
              <option value="">Cuenta de origen</option>
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="destino">Hacia</label>
            <select id="destino" value={cuentaDestinoId} onChange={(e) => setCuentaDestinoId(e.target.value)} required>
              <option value="">Cuenta de destino</option>
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div className="formulario-acciones">
            <button type="submit" className="boton boton-primario" disabled={guardando}>
              {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Agregar transferencia'}
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
        <h2>Tus transferencias</h2>
        {cargando ? (
          <p className="estado-cargando">Cargando...</p>
        ) : transferencias.length === 0 ? (
          <p className="estado-vacio">Todavía no has registrado ninguna transferencia.</p>
        ) : (
          <ul className="lista-movimientos">
            {transferencias.map((t) => (
              <li key={t.id} className="movimiento-fila">
                <span className="movimiento-icono movimiento-icono--transferencia">⇄</span>
                <div className="movimiento-info">
                  <div className="movimiento-descripcion">
                    {t.cuenta_origen?.nombre} → {t.cuenta_destino?.nombre}
                  </div>
                  <div className="movimiento-meta">
                    <span>{t.fecha}</span>
                  </div>
                </div>
                <span className="movimiento-monto movimiento-monto--neutral">{formatoPesos(t.monto)}</span>
                <div className="movimiento-acciones">
                  <button className="icon-btn" onClick={() => comenzarEdicion(t)} aria-label="Editar">✏️</button>
                  <button className="icon-btn" onClick={() => pedirEliminar(t.id)} aria-label="Eliminar">🗑️</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {idAEliminar && (
        <div className="modal-overlay" onClick={() => setIdAEliminar(null)}>
          <div className="modal-tarjeta" onClick={(e) => e.stopPropagation()}>
            <h3>Eliminar transferencia</h3>
            <p>¿Seguro que quieres eliminarla? Esta acción no se puede deshacer.</p>
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