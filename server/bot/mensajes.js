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
    `💡 El monto puede ir como 15000, 15.000 o "15 mil". ` +
    `Si me falta algún dato, te lo pregunto y puedes responder con un botón o escribiéndolo.\n` +
    `📅 <i>Ojo: por ahora solo registro movimientos de hoy; para otra fecha, usa la página.</i>` +
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

function movimientoRegistrado(resultado) {
  if (resultado.tipo === 'transferencia') {
    return `✅ Transferencia registrada: ${formatoPesos(resultado.monto)} de <b>${escapar(resultado.cuentaOrigen)}</b> a <b>${escapar(resultado.cuentaDestino)}</b>.`;
  }

  if (resultado.tipo === 'ingreso') {
    const descripcion = resultado.descripcion ? ` (${escapar(resultado.descripcion)})` : '';
    return `✅ Ingreso registrado: +${formatoPesos(resultado.monto)} en <b>${escapar(resultado.cuenta)}</b>${descripcion}.`;
  }

  const categoria = resultado.categoria ? ` en <b>${escapar(resultado.categoria)}</b>` : '';
  const descripcion = resultado.descripcion ? ` (${escapar(resultado.descripcion)})` : '';
  return `✅ Gasto registrado: -${formatoPesos(resultado.monto)}${categoria} desde <b>${escapar(resultado.cuenta)}</b>${descripcion}.`;
}

function noEntendido(detalle) {
  if (detalle) return `🤔 ${escapar(detalle)}`;
  return (
    `🤔 No logré entender eso. Cuéntame un gasto, ingreso o transferencia, ` +
    `por ejemplo: <code>Gasté 15000 en cena con Nequi</code>.\n` +
    `Escribe /ayuda para ver más ejemplos.`
  );
}

// Elige una frase al azar para que el bot no suene repetitivo.
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
  }[fase] || 'ese dato';
  return `🤔 No te entendí. Sigo esperando ${pide}.\nSi prefieres dejarlo, escribe <b>cancela</b>.`;
}

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
};