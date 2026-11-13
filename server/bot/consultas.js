const consultaService = require('../services/consultaService');
const resumenService = require('../services/resumenService');
const historialService = require('../services/historialService');
const { describirFecha } = require('../utils/fechas');
const { formatoPesos, escapar } = require('./mensajes');

const MAXIMO_CATEGORIAS = 5;
const CANTIDAD_ULTIMOS = 5;

const AYUDA_CONSULTAS =
  '📊 Puedo decirte tu saldo, cuánto gastaste o recibiste en un periodo, en qué gastas más y tus últimos movimientos. ' +
  'Por ejemplo: <code>¿Cuánto llevo gastado este mes?</code> o <code>¿Cuánto tengo en Nequi?</code>';

const PERIODO_NO_ENTENDIDO =
  '🤔 No entendí a qué periodo te refieres. Prueba con: <i>hoy</i>, <i>ayer</i>, <i>esta semana</i>, ' +
  '<i>este mes</i>, <i>el mes pasado</i>, <i>octubre</i> o <i>los últimos 7 días</i>.';

function noEncontrada(clase, nombre) {
  return `🤔 No encontré la ${clase} «${escapar(nombre)}». Revisa el nombre e inténtalo de nuevo.`;
}

function sumar(filas) {
  return filas.reduce((total, fila) => total + fila.monto, 0);
}

function plural(cantidad, singular, pluralTexto) {
  return `${cantidad} ${cantidad === 1 ? singular : pluralTexto}`;
}

async function responderSaldo(usuarioId, r) {
  const resumen = await resumenService.calcularResumen(usuarioId);

  if (r.cuenta) {
    const fila = resumen.saldoPorCuenta.find((c) => String(c.cuentaId) === String(r.cuenta.id));
    const saldo = fila ? fila.saldo : 0;
    return `🏦 En <b>${escapar(r.cuenta.nombre)}</b> tienes <b>${formatoPesos(saldo)}</b>.`;
  }

  let texto = `💰 Tu saldo disponible es <b>${formatoPesos(resumen.saldoDisponible)}</b>.`;
  if (resumen.saldoPorCuenta.length > 1) {
    const lineas = resumen.saldoPorCuenta.map((c) => `• ${escapar(c.nombre)}: ${formatoPesos(c.saldo)}`);
    texto += `\n\n${lineas.join('\n')}`;
  }
  return texto;
}

async function responderGastos(usuarioId, r) {
  const { desde, hasta, etiqueta } = r.periodo;
  const filas = await consultaService.gastosDelPeriodo(usuarioId, {
    desde,
    hasta,
    cuentaId: r.cuenta?.id,
    categoriaId: r.categoria?.id,
  });

  let filtros = '';
  if (r.categoria) filtros += ` en <b>${escapar(r.categoria.nombre)}</b>`;
  if (r.cuenta) filtros += ` con <b>${escapar(r.cuenta.nombre)}</b>`;

  if (filas.length === 0) return `🤷 No tienes gastos registrados${filtros} ${etiqueta}.`;

  return `💸 Gastaste <b>${formatoPesos(sumar(filas))}</b>${filtros} ${etiqueta} (${plural(filas.length, 'movimiento', 'movimientos')}).`;
}

async function responderIngresos(usuarioId, r) {
  const { desde, hasta, etiqueta } = r.periodo;
  const filas = await consultaService.ingresosDelPeriodo(usuarioId, { desde, hasta, cuentaId: r.cuenta?.id });

  const filtro = r.cuenta ? ` en <b>${escapar(r.cuenta.nombre)}</b>` : '';

  if (filas.length === 0) return `🤷 No tienes ingresos registrados${filtro} ${etiqueta}.`;

  return `💰 Recibiste <b>${formatoPesos(sumar(filas))}</b>${filtro} ${etiqueta} (${plural(filas.length, 'ingreso', 'ingresos')}).`;
}

async function responderCategorias(usuarioId, r) {
  const { desde, hasta, etiqueta } = r.periodo;
  const filas = await consultaService.gastosDelPeriodo(usuarioId, { desde, hasta, cuentaId: r.cuenta?.id });

  const filtro = r.cuenta ? ` con <b>${escapar(r.cuenta.nombre)}</b>` : '';

  if (filas.length === 0) return `🤷 No tienes gastos registrados${filtro} ${etiqueta}.`;

  const porCategoria = {};
  for (const fila of filas) {
    const nombre = fila.categoria?.nombre || 'Sin categoría';
    porCategoria[nombre] = (porCategoria[nombre] || 0) + fila.monto;
  }

  const total = sumar(filas);
  const ranking = Object.entries(porCategoria)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAXIMO_CATEGORIAS)
    .map(([nombre, monto], i) => `${i + 1}. ${escapar(nombre)}: ${formatoPesos(monto)} (${Math.round((monto / total) * 100)}%)`);

  return `📊 <b>En qué gastaste más ${etiqueta}</b>${filtro}\nTotal: ${formatoPesos(total)}\n\n${ranking.join('\n')}`;
}

function lineaMovimiento(m) {
  const cuando = describirFecha(m.fecha);

  if (m.tipo === 'transferencia') {
    return `🔁 ${formatoPesos(m.monto)} · ${escapar(m.cuenta_origen?.nombre)} → ${escapar(m.cuenta_destino?.nombre)} · ${cuando}`;
  }

  const descripcion = m.descripcion ? ` (${escapar(m.descripcion)})` : '';

  if (m.tipo === 'ingreso') {
    return `💰 +${formatoPesos(m.monto)} · ${escapar(m.cuenta?.nombre)}${descripcion} · ${cuando}`;
  }

  return `💸 -${formatoPesos(m.monto)} · ${escapar(m.categoria?.nombre || 'Sin categoría')}${descripcion} · ${cuando}`;
}

async function responderUltimos(usuarioId) {
  const movimientos = await historialService.listarHistorial(usuarioId, CANTIDAD_ULTIMOS);
  if (movimientos.length === 0) return '🤷 Aún no tienes movimientos registrados.';
  return `🧾 <b>Tus últimos movimientos</b>\n\n${movimientos.map(lineaMovimiento).join('\n')}`;
}

async function responder(usuarioId, r) {
  const usaPeriodo = ['gastos', 'ingresos', 'categorias'].includes(r.consulta);

  if (usaPeriodo && r.periodo.error) return PERIODO_NO_ENTENDIDO;

  if (r.consulta !== 'ultimos' && r.cuentaMencionada && !r.cuenta) {
    return noEncontrada('cuenta', r.cuentaMencionada);
  }
  if (r.consulta === 'gastos' && r.categoriaMencionada && !r.categoria) {
    return noEncontrada('categoría', r.categoriaMencionada);
  }

  if (r.consulta === 'saldo') return responderSaldo(usuarioId, r);
  if (r.consulta === 'gastos') return responderGastos(usuarioId, r);
  if (r.consulta === 'ingresos') return responderIngresos(usuarioId, r);
  if (r.consulta === 'categorias') return responderCategorias(usuarioId, r);
  if (r.consulta === 'ultimos') return responderUltimos(usuarioId);

  return AYUDA_CONSULTAS;
}

module.exports = { responder };