import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { obtenerResumen } from '../services/resumen';
import { listarHistorial } from '../services/historial';
import '../styles/movimientos.css';
import '../styles/dashboard.css';
import EtiquetaCuenta, { EtiquetasTransferencia } from '../components/EtiquetaCuenta';
import { useCategorias } from '../context/useCategorias';
import EtiquetaCategoria from '../components/EtiquetaCategoria';

function formatoPesos(numero) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(numero);
}


function iconoYColor(tipo) {
  if (tipo === 'ingreso') return { icono: '↑', clase: '' };
  if (tipo === 'gasto') return { icono: '↓', clase: 'movimiento-icono--gasto' };
  return { icono: '⇄', clase: 'movimiento-icono--transferencia' };
}

function descripcionMovimiento(m) {
  if (m.tipo === 'transferencia') {
    return (
      <EtiquetasTransferencia
        origen={m.cuenta_origen?.nombre}
        destino={m.cuenta_destino?.nombre}
      />
    );
  }
  return m.descripcion || 'Sin descripción';
} 
function montoConSigno(m) {
  const texto = formatoPesos(m.monto);
  if (m.tipo === 'ingreso') return `+ ${texto}`;
  if (m.tipo === 'gasto') return `- ${texto}`;
  return texto;
}

export default function General() {
  const { categorias } = useCategorias();
  const [resumen, setResumen] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const [datosResumen, datosHistorial] = await Promise.all([
          obtenerResumen(),
          listarHistorial(10),
        ]);
        if (activo) {
          setResumen(datosResumen);
          setHistorial(datosHistorial);
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
  }, [categorias]);

  if (cargando) return <div className="pagina"><p className="estado-cargando">Cargando...</p></div>;
  if (error) return <div className="pagina"><p className="mensaje-error">{error}</p></div>;

  return (
    <div className="pagina">
      <div className="pagina-header">
        <h1>General</h1>
        <p>Resumen de tus movimientos — {resumen.mes}</p>
      </div>

      <div className="tarjetas-resumen">
        <div className="tarjeta tarjeta-resumen">
          <span className="tarjeta-resumen-titulo">Gastado este mes</span>
          <span className="tarjeta-resumen-valor">{formatoPesos(resumen.gastadoEsteMes)}</span>
        </div>
        <div className="tarjeta tarjeta-resumen tarjeta-resumen--destacada">
          <span className="tarjeta-resumen-titulo">Saldo disponible</span>
          <span className="tarjeta-resumen-valor">{formatoPesos(resumen.saldoDisponible)}</span>
        </div>
        <div className="tarjeta tarjeta-resumen">
          <span className="tarjeta-resumen-titulo">Movimientos</span>
          <span className="tarjeta-resumen-valor">{resumen.movimientos}</span>
        </div>
      </div>

      <div className="dashboard-columnas">
        <div className="tarjeta">
          <h2>Últimos movimientos</h2>
          {historial.length === 0 ? (
            <p className="estado-vacio">Todavía no hay movimientos.</p>
          ) : (
            <ul className="lista-movimientos">
              {historial.map((m) => {
                const { icono, clase } = iconoYColor(m.tipo);
                return (
                  <li key={`${m.tipo}-${m.id}`} className="movimiento-fila">
                    <span className={`movimiento-icono ${clase}`}>{icono}</span>
                    <div className="movimiento-info">
                      <div className="movimiento-descripcion">{descripcionMovimiento(m)}</div>
                      <div className="movimiento-meta">
                        {m.tipo !== 'transferencia' && <EtiquetaCuenta nombre={m.cuenta?.nombre} />}
                        {m.tipo === 'gasto' && <EtiquetaCategoria categoria={m.categoria} />}
                        <span>{m.fecha}</span>
                      </div>
                    </div>
                    <span className={`movimiento-monto ${m.tipo === 'gasto' ? 'movimiento-monto--negativo' : m.tipo === 'transferencia' ? 'movimiento-monto--neutral' : ''}`}>
                      {montoConSigno(m)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="tarjeta">
          <h2>Distribución por categoría</h2>
          {resumen.distribucionCategoria.length === 0 ? (
            <p className="estado-vacio">Sin gastos este mes.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={resumen.distribucionCategoria}
                    dataKey="monto"
                    nameKey="nombre"
                    innerRadius={55}
                    outerRadius={85}
                  >
                    {resumen.distribucionCategoria.map((c) => (
                      <Cell key={c.nombre} fill={c.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(valor) => formatoPesos(valor)} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="leyenda-categorias">
                {resumen.distribucionCategoria.map((c) => (
                  <li key={c.nombre}>
                    <span className="leyenda-punto" style={{ background: c.color }} />
                    {c.nombre} — {c.porcentaje}%
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}