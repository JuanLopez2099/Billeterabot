import { useEffect, useState } from 'react';
import '../styles/movimientos.css';
import '../styles/dashboard.css';
import { useCuentas } from '../context/useCuentas';
import { obtenerResumen } from '../services/resumen';
import EtiquetaCuenta from '../components/EtiquetaCuenta';
import SelectorColor from '../components/SelectorColor';
import { IconoEliminar } from '../components/IconosAccion';

function formatoPesos(numero) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(numero);
}

const COLOR_INICIAL = '#1f5c3f';

export default function Cuentas() {
  const { cuentas, crear, eliminar } = useCuentas();
  const [saldos, setSaldos] = useState({});
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState(COLOR_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [idAEliminar, setIdAEliminar] = useState(null);

  // Los saldos ya los calcula el resumen del dashboard (solo trae las cuentas con movimientos).
  useEffect(() => {
    let activo = true;

    obtenerResumen()
      .then((resumen) => {
        if (!activo) return;
        const mapa = {};
        for (const c of resumen.saldoPorCuenta || []) mapa[c.cuentaId] = c.saldo;
        setSaldos(mapa);
      })
      .catch((err) => console.error('No se pudieron cargar los saldos:', err));

    return () => { activo = false; };
  }, []);

  async function manejarSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      await crear({ nombre, color });
      setNombre('');
      setColor(COLOR_INICIAL);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminar() {
    const id = idAEliminar;
    setIdAEliminar(null);
    setError('');
    try {
      await eliminar(id);
    } catch (err) {
      setError(err.message);
    }
  }

  const propias = cuentas.filter((c) => c.es_propia);
  const predefinidas = cuentas.filter((c) => !c.es_propia);
  const cuentaAEliminar = cuentas.find((c) => c.id === idAEliminar);

  // Igual que en el dashboard, un saldo negativo se muestra como 0.
  function saldoDe(cuenta) {
    return Math.max(0, saldos[cuenta.id] || 0);
  }

  return (
    <div className="pagina">
      <div className="pagina-header">
        <h1>Cuentas</h1>
        <p>Crea tus propias cuentas y revisa el saldo de cada una</p>
      </div>

      <div className="tarjeta">
        <h2>Nueva cuenta</h2>
        <form onSubmit={manejarSubmit} className="formulario-grid">
          <div className="campo-ancho">
            <label htmlFor="cuenta-nombre">Nombre</label>
            <input
              id="cuenta-nombre"
              type="text"
              placeholder="Ej. Ahorros"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={40}
              required
            />
          </div>
          <div className="campo-ancho">
            <label>Color</label>
            <SelectorColor value={color} onChange={setColor} />
          </div>
          <div className="formulario-acciones campo-ancho">
            <button type="submit" className="boton boton-primario" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Crear cuenta'}
            </button>
          </div>
        </form>
      </div>

      {error && <p className="mensaje-error">{error}</p>}

      <div className="tarjeta">
        <h2>Mis cuentas</h2>
        {propias.length === 0 ? (
          <p className="estado-vacio">Todavía no has creado cuentas propias.</p>
        ) : (
          <ul className="lista-movimientos">
            {propias.map((c) => (
              <li key={c.id} className="movimiento-fila">
                <div className="movimiento-info">
                  <EtiquetaCuenta nombre={c.nombre} />
                </div>
                <span className="movimiento-monto movimiento-monto--neutral">
                  {formatoPesos(saldoDe(c))}
                </span>
                <div className="movimiento-acciones">
                  <button
                    className="icon-btn icon-btn--peligro"
                    onClick={() => setIdAEliminar(c.id)}
                    aria-label="Eliminar cuenta"
                  >
                    <IconoEliminar />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="tarjeta">
        <h2>Cuentas predefinidas</h2>
        <ul className="lista-movimientos">
          {predefinidas.map((c) => (
            <li key={c.id} className="movimiento-fila">
              <div className="movimiento-info">
                <EtiquetaCuenta nombre={c.nombre} />
              </div>
              <span className="movimiento-monto movimiento-monto--neutral">
                {formatoPesos(saldoDe(c))}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {idAEliminar && (
        <div className="modal-overlay" onClick={() => setIdAEliminar(null)}>
          <div className="modal-tarjeta" onClick={(e) => e.stopPropagation()}>
            <h3>Eliminar cuenta</h3>
            <p>
              ¿Seguro que quieres eliminar «{cuentaAEliminar?.nombre}»? Esta acción no se
              puede deshacer.
            </p>
            <div className="modal-acciones">
              <button className="boton boton-secundario" onClick={() => setIdAEliminar(null)}>
                Cancelar
              </button>
              <button className="boton boton-peligro" onClick={confirmarEliminar}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}