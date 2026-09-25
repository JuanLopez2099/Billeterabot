import { useEffect, useState } from 'react';
import { listarIngresos, crearIngreso, eliminarIngreso, listarCuentas } from '../services/ingresos';

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

  return () => {
    activo = false; 
  };
}, []);

  async function manejarSubmit(e) {
    e.preventDefault(); 
    setGuardando(true);
    try {
      await crearIngreso({ monto, cuentaId, descripcion, fecha });
      setMonto('');
      setDescripcion('');
      setFecha(hoy);
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
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 16px' }}>
      <h1>Ingresos</h1>

      <form onSubmit={manejarSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
        <input
          type="number"
          placeholder="Monto"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          required
        />
        <select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)} required>
          <option value="">Selecciona una cuenta</option>
          {cuentas.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Descripción (opcional)"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
        <input
          type="date"
          value={fecha}
          max={hoy}
          onChange={(e) => setFecha(e.target.value)}
          required
        />
        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Agregar ingreso'}
        </button>
      </form>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {ingresos.map((ing) => (
            <li
              key={ing.id}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd', padding: '8px 0' }}
            >
              <span>
                {ing.descripcion || 'Sin descripción'} — {ing.cuenta?.nombre} — {ing.fecha}
              </span>
              <span>
                {formatoPesos(ing.monto)}
                <button onClick={() => manejarEliminar(ing.id)} style={{ marginLeft: 8 }}>🗑</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}