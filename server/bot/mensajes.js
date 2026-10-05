
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
    `📝 <b>Cómo escribirme tus movimientos</b>\n` +
    `Te sugerimos estos formatos:\n\n` +
    `💸 <b>Gastos</b>\n` +
    `Gasté "monto" en "descripción" con "cuenta"\n` +
    `<i>Ejemplo:</i> <code>Gasté 15000 en cena con Nequi</code>\n\n` +
    `💰 <b>Ingresos</b>\n` +
    `Recibí "monto" de "descripción" en "cuenta"\n` +
    `<i>Ejemplo:</i> <code>Recibí 500000 de salario en Bancolombia</code>\n\n` +
    `🔁 <b>Transferencias</b>\n` +
    `Transferí "monto" de "cuenta_origen" a "cuenta_destino"\n` +
    `<i>Ejemplo:</i> <code>Transferí 50000 de Nequi a Bancolombia</code>\n\n` +
    `💡 El monto puede ser 15000, 15.000 o "15 mil". También entiendo fechas como "ayer". ` +
    `La categoría la deduzco de la descripción; si no puedo, te pregunto. ` +
    `Y si me falta algún dato, también te lo pregunto.` +
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

function notaFecha(token) {
  return token === 'ayer' ? ' (ayer)' : '';
}

function movimientoRegistrado(resultado) {
  const fecha = notaFecha(resultado.fechaToken);

  if (resultado.tipo === 'transferencia') {
    return `✅ Transferencia registrada: ${formatoPesos(resultado.monto)} de <b>${escapar(resultado.cuentaOrigen)}</b> a <b>${escapar(resultado.cuentaDestino)}</b>${fecha}.`;
  }

  if (resultado.tipo === 'ingreso') {
    const descripcion = resultado.descripcion ? ` (${escapar(resultado.descripcion)})` : '';
    return `✅ Ingreso registrado: +${formatoPesos(resultado.monto)} en <b>${escapar(resultado.cuenta)}</b>${descripcion}${fecha}.`;
  }

  const categoria = resultado.categoria ? ` en <b>${escapar(resultado.categoria)}</b>` : '';
  const descripcion = resultado.descripcion ? ` (${escapar(resultado.descripcion)})` : '';
  return `✅ Gasto registrado: -${formatoPesos(resultado.monto)}${categoria} desde <b>${escapar(resultado.cuenta)}</b>${descripcion}${fecha}.`;
}

function noEntendido(detalle) {
  if (detalle) return `🤔 ${escapar(detalle)}`;
  return `🤔 No logré entender ese movimiento. Escribe /ayuda para ver ejemplos.`;
}

module.exports = {
  escapar,
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
};