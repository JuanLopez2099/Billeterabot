const { fechaDeHoy, describirFecha } = require('../utils/fechas');

function escapar(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function listaDeCuentas(cuentas) {
  if (!cuentas || cuentas.length === 0) return '';
  const nombres = cuentas.map((c) => escapar(c.nombre)).join(', ');
  return `\n🏦 <b>Cuentas disponibles:</b> ${nombres}`;
}

function formatos(cuentas) {
  return (
    `📝 <b>Escríbeme como hablas</b>\n` +
    `Cuéntame tus movimientos con tus palabras y yo me encargo del resto:\n\n` +
    `💸 <code>Gasté 15000 en cena con Nequi</code>\n` +
    `💰 <code>Me llegaron 500 mil de salario a Bancolombia</code>\n` +
    `🔁 <code>Pasé 50000 de Nequi a Bancolombia</code>\n\n` +
    `➕ También puedo crear cuentas y categorías: <code>Crea la cuenta Binance</code> o <code>Crea la categoría Maquillaje</code>\n` +
    `📊 Y responder preguntas: <code>¿Cuánto llevo gastado este mes?</code> o <code>¿Cuánto tengo en Nequi?</code>\n\n` +
    `💡 El monto puede ir como 15000, 15.000 o "15 mil". ` +
    `Si me falta algún dato, te lo pregunto y puedes responder con un botón o escribiéndolo.\n` +
    `📅 También puedes decirme cuándo fue: <i>ayer</i>, <i>el lunes</i> o <i>el 3 de noviembre</i>. Si no lo digo, lo registro con la fecha de hoy.` +
    `${listaDeCuentas(cuentas)}\n\n` +
    `Escribe /ayuda cuando quieras ver esto otra vez.`
  );
}

function vinculado(nombre, cuentas) {
  return `✅ <b>¡Listo, ${escapar(nombre)}!</b> Tu cuenta quedó vinculada.\n\n` +
    `Ya puedes registrar tus gastos, ingresos y transferencias escribiéndome aquí.\n\n${formatos(cuentas)}`;
}

function bienvenidaDeNuevo(nombre, cuentas) {
  return `👋 <b>¡Hola de nuevo, ${escapar(nombre)}!</b>\n\n${formatos(cuentas)}`;
}

function sinVincular() {
  return (
    `👋 <b>¡Hola! Soy Billeterabot.</b>\n` +
    `Te ayudo a registrar tus gastos, ingresos y transferencias escribiéndome en este chat.\n\n` +
    `Para empezar, vincula tu cuenta:\n` +
    `1️⃣ Entra a Billeterabot en la web.\n` +
    `2️⃣ Pulsa «Vincular Telegram».\n` +
    `3️⃣ Abre el enlace que te muestra y vuelve aquí.`
  );
}

const codigoInvalido =
  '⚠️ Ese código no es válido o ya venció.\nGenera uno nuevo desde la web con «Vincular Telegram» y abre el enlace otra vez.';

const chatOcupado =
  '⚠️ Este chat de Telegram ya está vinculado a otra cuenta de Billeterabot.\nDesvincúlalo primero desde esa cuenta e intenta de nuevo.';

const errorTemporal =
  '😕 Tuve un problema temporal y no pude completar eso. Intenta de nuevo en un momento.';

const proximamente =
  '✅ Recibí tu mensaje. Muy pronto podré registrar tus movimientos desde aquí.\nEscribe /ayuda para ver cómo vas a poder escribirlos.';

function formatoPesos(numero) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(numero);
}

function movimientoRegistrado(resultado, corregido = false) {
  const icono = corregido ? '✏️' : '✅';
  const hecho = (femenino) => (corregido ? 'actualizad' : 'registrad') + (femenino ? 'a' : 'o');

  const cuando = resultado.fecha && resultado.fecha !== fechaDeHoy() ? ` 📅 ${describirFecha(resultado.fecha)}` : '';

  if (resultado.tipo === 'transferencia') {
    return `${icono} Transferencia ${hecho(true)}: ${formatoPesos(resultado.monto)} de <b>${escapar(resultado.cuentaOrigen)}</b> a <b>${escapar(resultado.cuentaDestino)}</b>.${cuando}`;
  }

  if (resultado.tipo === 'ingreso') {
    const descripcion = resultado.descripcion ? ` (${escapar(resultado.descripcion)})` : '';
    return `${icono} Ingreso ${hecho(false)}: +${formatoPesos(resultado.monto)} en <b>${escapar(resultado.cuenta)}</b>${descripcion}.${cuando}`;
  }

  const categoria = resultado.categoria ? ` en <b>${escapar(resultado.categoria)}</b>` : '';
  const descripcion = resultado.descripcion ? ` (${escapar(resultado.descripcion)})` : '';
  return `${icono} Gasto ${hecho(false)}: -${formatoPesos(resultado.monto)}${categoria} desde <b>${escapar(resultado.cuenta)}</b>${descripcion}.${cuando}`;
}

function noEntendido(detalle) {
  if (detalle) return `🤔 ${escapar(detalle)}`;
  return (
    `🤔 No logré entender eso. Cuéntame un gasto, ingreso o transferencia, ` +
    `por ejemplo: <code>Gasté 15000 en cena con Nequi</code>.\n` +
    `Escribe /ayuda para ver más ejemplos.`
  );
}

function alAzar(frases) {
  return frases[Math.floor(Math.random() * frases.length)];
}

function primerNombre(nombre) {
  return escapar(String(nombre || '').trim().split(/\s+/)[0]);
}

function saludo(nombre) {
  const n = primerNombre(nombre);
  const quien = n ? `, ${n}` : '';
  return alAzar([
    `👋 ¡Hola${quien}! ¿Qué movimiento registramos hoy?`,
    `¡Hola${quien}! Cuéntame qué gastaste o recibiste. 💸`,
    `👋 ¡Buenas${quien}! Dime, ¿qué anotamos?`,
  ]);
}

function agradecimiento() {
  return alAzar([
    '¡Con gusto! 😊',
    '¡De nada! Aquí estoy cuando quieras anotar algo más.',
    '¡Listo! 👍',
  ]);
}

const cancelado = '🚫 Listo, no registré nada.';

function recordatorioPregunta(fase) {
  const pide = {
    monto: 'el monto (por ejemplo <code>20000</code> o <code>20 mil</code>)',
    cuenta: 'la cuenta (toca un botón o escribe su nombre)',
    cuentaDestino: 'la cuenta de destino (toca un botón o escribe su nombre)',
    categoria: 'la categoría (toca un botón o escribe su nombre)',
    crearCuenta: 'saber si creo la cuenta (toca un botón o escribe sí o no)',
    crearCuentaDestino: 'saber si creo la cuenta (toca un botón o escribe sí o no)',
    crearCategoria: 'saber si creo la categoría (toca un botón o escribe sí o no)',
  }[fase] || 'ese dato';
  return `🤔 No te entendí. Sigo esperando ${pide}.\nSi prefieres dejarlo, escribe <b>cancela</b>.`;
}

const sinMovimientoReciente =
  '🤷 No tengo un movimiento reciente para eso. Si es uno más antiguo, puedes corregirlo o eliminarlo desde la página.';

const nadaQueCorregir =
  '🤔 No entendí qué quieres cambiar. Puedes decirme, por ejemplo: <code>eran 20000</code>, <code>ponlo en Nequi</code> o <code>era de transporte</code>.';

function sinCategoria(tipo) {
  return tipo === 'ingreso'
    ? '🤔 Los ingresos no tienen categoría.'
    : '🤔 Las transferencias no tienen categoría.';
}

function movimientoDeshecho(m) {
  const descripcion = m.descripcion ? ` (${escapar(m.descripcion)})` : '';
  if (m.tipo === 'transferencia') {
    return `↩️ Listo, deshice la transferencia de ${formatoPesos(m.monto)} de <b>${escapar(m.cuentaNombre)}</b> a <b>${escapar(m.cuentaDestinoNombre)}</b>.`;
  }
  if (m.tipo === 'ingreso') {
    return `↩️ Listo, deshice el ingreso de ${formatoPesos(m.monto)}${descripcion}.`;
  }
  return `↩️ Listo, deshice el gasto de ${formatoPesos(m.monto)}${descripcion}.`;
}

function proponerCrear(clase, nombre) {
  const articulo = clase === 'cuenta' ? 'una cuenta' : 'una categoría';
  return `🤔 No tienes ${articulo} llamada <b>${escapar(nombre)}</b>. ¿La creo?`;
}

function entidadCreada(clase, nombre) {
  const rotulo = clase === 'cuenta' ? 'Cuenta' : 'Categoría';
  return `✅ ${rotulo} «${escapar(nombre)}» creada.`;
}

function fechaNoValida(motivo) {
  if (motivo === 'futura') {
    return '📅 Esa fecha todavía no llega. Solo puedo registrar movimientos de hoy o de días pasados.';
  }
  if (motivo === 'antigua') {
    return '📅 Esa fecha es de hace más de un año. Para movimientos tan antiguos usa la página.';
  }
  return '📅 No entendí la fecha. Dímela de otra forma, por ejemplo <code>ayer</code>, <code>el lunes</code> o <code>el 3 de noviembre</code>.';
}

function creadaPorPedido(clase, nombre) {
  const uso = clase === 'cuenta'
    ? 'Ya puedes usarla en tus movimientos.'
    : 'Ya puedes usarla para clasificar tus gastos.';
  return `${entidadCreada(clase, nombre)} ${uso}`;
}

function faltaNombre(clase) {
  const ejemplo = clase === 'cuenta' ? 'Crea la cuenta Binance' : 'Crea la categoría Maquillaje';
  return `🤔 ¿Cómo se llamará la ${clase}? Dímelo así: <code>${ejemplo}</code>.`;
}

function yaExiste(clase, nombre) {
  const articulo = clase === 'cuenta' ? 'una cuenta' : 'una categoría';
  return `👍 Ya tienes ${articulo} llamada <b>${escapar(nombre)}</b>, así que no hace falta crearla.`;
}

const noSeCrea = '👌 Está bien, no la creo.';

const sinCambios = '👌 Listo, no cambié nada.';

module.exports = {
  escapar,
  formatoPesos,
  formatos,
  vinculado,
  bienvenidaDeNuevo,
  sinVincular,
  codigoInvalido,
  chatOcupado,
  errorTemporal,
  proximamente,
  movimientoRegistrado,
  noEntendido,
  saludo,
  agradecimiento,
  cancelado,
  recordatorioPregunta,
  sinMovimientoReciente,
  nadaQueCorregir,
  sinCategoria,
  movimientoDeshecho,
  proponerCrear,
  entidadCreada,
  creadaPorPedido,
  fechaNoValida,
  faltaNombre,
  yaExiste,
  noSeCrea,
  sinCambios,
};