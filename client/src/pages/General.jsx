import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { obtenerResumen } from '../services/resumen';
import { listarHistorial } from '../services/historial';
import '../styles/movimientos.css';
import '../styles/dashboard.css';
import EtiquetaCuenta, { EtiquetasTransferencia } from '../components/EtiquetaCuenta';
import EtiquetaCategoria from '../components/EtiquetaCategoria';
import SelectorMes from '../components/SelectorMes';
import { useCategorias } from '../context/useCategorias';


function formatoPesos(numero) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(numero);
}

function formatoCompacto(numero) {
  return new Intl.NumberFormat('es-CO', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(numero);
}

const NOMBRES_MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatoMesCorto(mes) {
  return NOMBRES_MES[Number(mes.slice(5, 7)) - 1];
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


function Comparacion({ valor, positivoEsBueno, etiqueta, textoVacio }) {
  if (valor === null) {
    return (
      <span className="tarjeta-resumen-sub tarjeta-resumen-sub--neutral">
        {textoVacio}
      </span>
    );
  }

  const esBueno = positivoEsBueno ? valor >= 0 : valor <= 0;
  const flecha = valor > 0 ? '▲' : valor < 0 ? '▼' : '—';

  return (
    <span
      className={`tarjeta-resumen-sub ${
        esBueno ? 'tarjeta-resumen-sub--positivo' : 'tarjeta-resumen-sub--negativo'
      }`}
    >
      {flecha} {Math.abs(valor)}% {etiqueta}
    </span>
  );
}

export default function General() {
  const { categorias } = useCategorias();

  const mesActual = new Date()
    .toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
    .slice(0, 7);
  const [mes, setMes] = useState(mesActual);

  const [resumen, setResumen] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const [datosResumen, datosHistorial] = await Promise.all([
          obtenerResumen(mes),
          listarHistorial(15),
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

    function recargarAlVolver() {
      cargar();
    }

    window.addEventListener('focus', recargarAlVolver);
    cargar();
    return () => {
      activo = false;
      window.removeEventListener('focus', recargarAlVolver);
    };
  }, [mes, categorias]);

  if (cargando && !resumen) {
    return (
      <div className="pagina-dashboard">
        <p className="estado-cargando">Cargando...</p>
      </div>
    );
  }

  if (error && !resumen) {
    return (
      <div className="pagina-dashboard">
        <p className="mensaje-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="pagina-dashboard">
      <div className="pagina-header pagina-header--dashboard">
        <div>
          <h1>General</h1>
          <p>Resumen de tus movimientos</p>
        </div>
        <SelectorMes mes={mes} mesMaximo={mesActual} onCambiar={setMes} />
      </div>

      {error && <p className="mensaje-error">{error}</p>}

      <div className="dashboard-columnas">
        {/* Columna izquierda: resumen, saldos, movimientos y top de gastos */}
        <div className="dashboard-columna">
          <div className="tarjetas-resumen">
            <div className="tarjeta tarjeta-resumen tarjeta-resumen--destacada tarjeta-resumen--ancha">
              <span className="tarjeta-resumen-titulo">Saldo disponible histórico</span>
              <span className="tarjeta-resumen-valor">
                {formatoPesos(resumen.saldoDisponible)}
              </span>
            </div>

            <div className="tarjeta tarjeta-resumen">
              <span className="tarjeta-resumen-titulo">Ingresos del mes</span>
              <span className="tarjeta-resumen-valor">
                {formatoPesos(resumen.ingresosEsteMes)}
              </span>
            </div>

            <div className="tarjeta tarjeta-resumen">
              <span className="tarjeta-resumen-titulo">Gastos del mes</span>
              <span className="tarjeta-resumen-valor">
                {formatoPesos(resumen.gastadoEsteMes)}
              </span>
              <Comparacion
                valor={resumen.variacionGastos}
                positivoEsBueno={false}
                etiqueta="vs. mes anterior"
                textoVacio="Sin gastos el mes anterior"
              />
            </div>

            <div className="tarjeta tarjeta-resumen">
              <span className="tarjeta-resumen-titulo">Balance del mes</span>
              <span
                className={`tarjeta-resumen-valor ${
                  resumen.balanceMes < 0 ? 'tarjeta-resumen-valor--negativo' : ''
                }`}
              >
                {formatoPesos(resumen.balanceMes)}
              </span>
              {resumen.porcentajeAhorro === null ? (
                <span className="tarjeta-resumen-sub tarjeta-resumen-sub--neutral">
                  Sin ingresos este mes
                </span>
              ) : resumen.balanceMes >= 0 ? (
                <span className="tarjeta-resumen-sub tarjeta-resumen-sub--positivo">
                  Ahorraste el {resumen.porcentajeAhorro}%
                </span>
              ) : (
                <span className="tarjeta-resumen-sub tarjeta-resumen-sub--negativo">
                  Gastaste más de lo que ingresó
                </span>
              )}
            </div>

            <div className="tarjeta tarjeta-resumen">
              <span className="tarjeta-resumen-titulo">Promedio diario</span>
              <span className="tarjeta-resumen-valor">
                {formatoPesos(resumen.promedioDiarioGasto)}
              </span>
            </div>
          </div>

          <div className="tarjeta">
            <h2>Saldo por cuenta</h2>

            {resumen.saldoPorCuenta?.length ? (
              <div className="saldo-cuentas-grid">
                {resumen.saldoPorCuenta.map((cuenta) => (
                  <article
                    key={cuenta.cuentaId}
                    className="saldo-cuenta"
                  >
                    <EtiquetaCuenta nombre={cuenta.nombre} />
                    <span className="saldo-cuenta-valor">
                      {formatoPesos(Math.max(0, cuenta.saldo))}
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <p className="estado-vacio">Todavía no hay saldos por cuenta.</p>
            )}
          </div>

          <div className="tarjeta">
            <div className="tarjeta-encabezado">
              <h2>Últimos movimientos</h2>
              <span className="tarjeta-encabezado-nota">
                {resumen.movimientos} este mes
              </span>
            </div>

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
                        <div className="movimiento-descripcion">
                          {descripcionMovimiento(m)}
                        </div>
                        <div className="movimiento-meta">
                          {m.tipo !== 'transferencia' && (
                            <EtiquetaCuenta nombre={m.cuenta?.nombre} />
                          )}
                          {m.tipo === 'gasto' && (
                            <EtiquetaCategoria categoria={m.categoria} />
                          )}
                          <span>{m.fecha}</span>
                        </div>
                      </div>

                      <span
                        className={`movimiento-monto ${
                          m.tipo === 'gasto'
                            ? 'movimiento-monto--negativo'
                            : m.tipo === 'transferencia'
                              ? 'movimiento-monto--neutral'
                              : ''
                        }`}
                      >
                        {montoConSigno(m)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="tarjeta">
            <h2>Top 5 de gastos</h2>

            {resumen.topGastos?.length ? (
              <ol className="top-gastos-lista">
                {resumen.topGastos.map((gasto, indice) => (
                  <li key={gasto.id} className="top-gasto-item">
                    <span className="top-gasto-numero" aria-hidden="true">
                      {indice + 1}
                    </span>

                    <div className="top-gasto-info">
                      <div className="top-gasto-descripcion">
                        {gasto.descripcion || 'Gasto sin descripción'}
                      </div>

                      <div className="top-gasto-meta">
                        <EtiquetaCategoria categoria={gasto.categoria} />
                        {gasto.cuenta && (
                          <EtiquetaCuenta nombre={gasto.cuenta} />
                        )}
                        <span>{gasto.fecha}</span>
                      </div>
                    </div>

                    <span className="top-gasto-monto">
                      {formatoPesos(gasto.monto)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="estado-vacio">
                No hay gastos para mostrar este mes.
              </p>
            )}
          </div>
        </div>

        {/* Columna derecha: gráficos */}
        <div className="dashboard-columna">
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
                      innerRadius={50}
                      outerRadius={80}
                      stroke="var(--color-surface)"
                      strokeWidth={2}
                    >
                      {resumen.distribucionCategoria.map((categoria) => (
                        <Cell
                          key={categoria.nombre}
                          fill={categoria.color}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(valor) => formatoPesos(valor)} />
                  </PieChart>
                </ResponsiveContainer>

                <ul className="leyenda-categorias">
                  {resumen.distribucionCategoria.map((categoria) => (
                    <li key={categoria.nombre}>
                      <span
                        className="leyenda-punto"
                        style={{ background: categoria.color }}
                      />
                      {categoria.nombre} — {formatoPesos(categoria.monto)} (
                      {categoria.porcentaje}%)
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="tarjeta">
            <h2>Ingresos vs. gastos — últimos 6 meses</h2>

            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={resumen.ingresosVsGastos}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                />
                <XAxis
                  dataKey="mes"
                  tickFormatter={formatoMesCorto}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={formatoCompacto}
                  tick={{ fontSize: 11 }}
                  width={48}
                />
                <Tooltip
                  formatter={(valor) => formatoPesos(valor)}
                  labelFormatter={formatoMesCorto}
                />
                <Bar
                  dataKey="ingresos"
                  name="Ingresos"
                  fill="#1f5c3f"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="gastos"
                  name="Gastos"
                  fill="#b3413a"
                  radius={[4, 4, 0, 0]}
                />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="tarjeta">
            <h2>Gasto acumulado: este mes vs. el anterior</h2>

            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={resumen.gastoAcumulado}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                />
                <XAxis dataKey="dia" tick={{ fontSize: 11 }} interval={4} />
                <YAxis
                  tickFormatter={formatoCompacto}
                  tick={{ fontSize: 11 }}
                  width={48}
                />
                <Tooltip
                  formatter={(valor) =>
                    valor === null ? '—' : formatoPesos(valor)
                  }
                  labelFormatter={(dia) => `Día ${dia}`}
                />
                <Line
                  type="monotone"
                  dataKey="anterior"
                  stroke="#a9a89c"
                  strokeDasharray="4 3"
                  dot={false}
                  name="Mes anterior"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#1f5c3f"
                  strokeWidth={2}
                  dot={false}
                  name="Este mes"
                  connectNulls={false}
                />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="tarjeta">
            <h2>Gasto por día de la semana</h2>

            {resumen.gastadoEsteMes === 0 ? (
              <p className="estado-vacio">Sin gastos este mes.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={resumen.gastoPorDiaSemana}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--color-border)"
                  />
                  <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                  <YAxis
                    tickFormatter={formatoCompacto}
                    tick={{ fontSize: 11 }}
                    width={48}
                  />
                  <Tooltip formatter={(valor) => formatoPesos(valor)} />
                  <Bar
                    dataKey="monto"
                    name="Gastos"
                    fill="#b3413a"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}