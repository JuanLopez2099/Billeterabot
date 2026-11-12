const crypto = require('crypto');
const { InlineKeyboard } = require('grammy');
const interpretacionService = require('../services/interpretacionService');
const telegramService = require('../services/telegramService');
const ingresoService = require('../services/ingresoService');
const gastoService = require('../services/gastoService');
const transferenciaService = require('../services/transferenciaService');
const conversacion = require('../utils/conversacion');
const mensajes = require('./mensajes');


const HTML = { parse_mode: 'HTML' };
const SIN_TECLADO = { parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } };

const LARGO_MAXIMO_MENSAJE = 300;
const MENSAJES_POR_MINUTO = 10;
const VENCIMIENTO_PREGUNTA_MS = 10 * 60 * 1000;


const pendientes = new Map();             
const preguntaActivaPorChat = new Map();  


const VENCIMIENTO_ULTIMO_MS = 30 * 60 * 1000;
const ultimoPorChat = new Map();          

function ultimoValido(chatId) {
  const ultimo = ultimoPorChat.get(chatId);
  if (!ultimo) return null;
  if (Date.now() - ultimo.creadoEn > VENCIMIENTO_ULTIMO_MS) {
    ultimoPorChat.delete(chatId);
    return null;
  }
  return ultimo;
}

const historialEnvios = new Map();

function dentroDelLimite(chatId) {
  const ahora = Date.now();
  const envios = (historialEnvios.get(chatId) || []).filter((t) => ahora - t < 60_000);
  envios.push(ahora);
  historialEnvios.set(chatId, envios);
  return envios.length <= MENSAJES_POR_MINUTO;
}

function pendienteVencido(pendiente) {
  return Date.now() - pendiente.creadoEn > VENCIMIENTO_PREGUNTA_MS;
}

function guardarPendiente(chatId, preguntaId, pendiente) {
  const anterior = preguntaActivaPorChat.get(chatId);
  if (anterior && anterior !== preguntaId) pendientes.delete(anterior);
  pendientes.set(preguntaId, pendiente);
  preguntaActivaPorChat.set(chatId, preguntaId);
}

function cerrarPendiente(chatId, preguntaId) {
  pendientes.delete(preguntaId);
  if (preguntaActivaPorChat.get(chatId) === preguntaId) preguntaActivaPorChat.delete(chatId);
}


function pendienteActivo(chatId) {
  const preguntaId = preguntaActivaPorChat.get(chatId);
  if (!preguntaId) return null;
  const pendiente = pendientes.get(preguntaId);
  if (!pendiente || pendienteVencido(pendiente)) {
    cerrarPendiente(chatId, preguntaId);
    return null;
  }
  return { preguntaId, pendiente };
}


async function actualizarMensajePregunta(ctx, pendiente, texto) {
  if (!pendiente.mensajeId) return;
  try {
    await ctx.api.editMessageText(ctx.chat.id, pendiente.mensajeId, texto, SIN_TECLADO);
  } catch {

  }
}


async function quitarBotones(ctx, mensajeId) {
  if (!mensajeId) return;
  try {
    await ctx.api.editMessageReplyMarkup(ctx.chat.id, mensajeId, { reply_markup: { inline_keyboard: [] } });
  } catch {

  }
}

async function descartarPreguntaActiva(ctx) {
  const activo = pendienteActivo(ctx.chat.id);
  if (!activo) return;
  cerrarPendiente(ctx.chat.id, activo.preguntaId);
  await actualizarMensajePregunta(ctx, activo.pendiente, '↪️ Pregunta descartada.');
}


function tecladoCuentas(preguntaId, cuentas) {
  const teclado = new InlineKeyboard();
  cuentas.forEach((c, i) => {
    teclado.text(c.nombre, `cuenta:${preguntaId}:${c.id}`);
    if (i % 2 === 1) teclado.row();
  });
  return teclado;
}

function tecladoCategorias(preguntaId, categorias) {
  const teclado = new InlineKeyboard();
  categorias.forEach((c, i) => {
    teclado.text(c.nombre, `categoria:${preguntaId}:${c.id}`);
    if (i % 2 === 1) teclado.row();
  });
  teclado.row().text('Sin categoría', `categoria:${preguntaId}:ninguna`);
  return teclado;
}

function cuentasParaFase(pendiente) {
  if (pendiente.fase === 'cuentaDestino') {
    return pendiente.cuentasDisponibles.filter((c) => c.id !== pendiente.cuentaId);
  }
  return pendiente.cuentasDisponibles;
}


function aplicarCuenta(pendiente, cuenta) {
  if (pendiente.fase === 'cuentaDestino') {
    pendiente.cuentaDestinoId = cuenta.id;
    pendiente.cuentaDestinoNombre = cuenta.nombre;
  } else {
    pendiente.cuentaId = cuenta.id;
    pendiente.cuentaNombre = cuenta.nombre;
  }
}

function etiquetaCuenta(pendiente, cuenta) {
  const rotulo = pendiente.fase === 'cuentaDestino' ? 'Cuenta destino' : 'Cuenta';
  return `✅ ${rotulo}: ${mensajes.escapar(cuenta.nombre)}`;
}

function aplicarCategoria(pendiente, categoria) {
  pendiente.categoriaId = categoria ? categoria.id : null;
  pendiente.categoriaNombre = categoria ? categoria.nombre : null;
}


async function guardarYResponder(ctx, pendiente) {
  const { usuarioId, tipo, monto, descripcion, fecha, cuentaId, cuentaDestinoId, categoriaId } = pendiente;

  let registro;
  if (tipo === 'transferencia') {
    registro = await transferenciaService.crearTransferencia(usuarioId, {
      monto, cuentaOrigenId: cuentaId, cuentaDestinoId, fecha,
    });
  } else if (tipo === 'ingreso') {
    registro = await ingresoService.crearIngreso(usuarioId, { monto, cuentaId, descripcion, fecha });
  } else {
    registro = await gastoService.crearGasto(usuarioId, { monto, cuentaId, categoriaId, descripcion, fecha });
  }

  const resumen = mensajes.movimientoRegistrado({
    tipo,
    monto: registro.monto,
    descripcion: registro.descripcion,
    cuenta: pendiente.cuentaNombre,
    cuentaOrigen: pendiente.cuentaNombre,
    cuentaDestino: pendiente.cuentaDestinoNombre,
    categoria: pendiente.categoriaNombre,
  });

  const teclado = new InlineKeyboard().text('↩️ Deshacer', `deshacer:${tipo}:${registro.id}`);
  const enviado = await ctx.reply(resumen, { ...HTML, reply_markup: teclado });


  ultimoPorChat.set(ctx.chat.id, {
    id: registro.id,
    tipo,
    monto: registro.monto,
    descripcion: registro.descripcion ?? descripcion ?? null,
    fecha,
    cuentaId,
    cuentaNombre: pendiente.cuentaNombre,
    cuentaDestinoId: cuentaDestinoId ?? null,
    cuentaDestinoNombre: pendiente.cuentaDestinoNombre ?? null,
    categoriaId: categoriaId ?? null,
    categoriaNombre: pendiente.categoriaNombre ?? null,
    mensajeId: enviado.message_id,
    creadoEn: Date.now(),
  });
}


async function eliminarMovimiento(usuarioId, tipo, id) {
  if (tipo === 'gasto') return gastoService.eliminarGasto(usuarioId, id);
  if (tipo === 'ingreso') return ingresoService.eliminarIngreso(usuarioId, id);
  return transferenciaService.eliminarTransferencia(usuarioId, id);
}


async function editarMovimiento(usuarioId, m) {
  if (m.tipo === 'transferencia') {
    return transferenciaService.editarTransferencia(usuarioId, m.id, {
      monto: m.monto, cuentaOrigenId: m.cuentaId, cuentaDestinoId: m.cuentaDestinoId, fecha: m.fecha,
    });
  }
  if (m.tipo === 'ingreso') {
    return ingresoService.editarIngreso(usuarioId, m.id, {
      monto: m.monto, cuentaId: m.cuentaId, descripcion: m.descripcion, fecha: m.fecha,
    });
  }
  return gastoService.editarGasto(usuarioId, m.id, {
    monto: m.monto, cuentaId: m.cuentaId, categoriaId: m.categoriaId, descripcion: m.descripcion, fecha: m.fecha,
  });
}


async function deshacerUltimo(ctx, usuarioId) {
  const activo = pendienteActivo(ctx.chat.id);
  if (activo) {
    cerrarPendiente(ctx.chat.id, activo.preguntaId);
    await actualizarMensajePregunta(ctx, activo.pendiente, '🚫 Pregunta cancelada.');
    return ctx.reply(mensajes.cancelado, HTML);
  }

  const ultimo = ultimoValido(ctx.chat.id);
  if (!ultimo) return ctx.reply(mensajes.sinMovimientoReciente, HTML);

  try {
    await eliminarMovimiento(usuarioId, ultimo.tipo, ultimo.id);
  } catch (error) {
    if (error.status === 404) {
      ultimoPorChat.delete(ctx.chat.id);
      return ctx.reply(mensajes.sinMovimientoReciente, HTML);
    }
    throw error;
  }

  ultimoPorChat.delete(ctx.chat.id);
  await quitarBotones(ctx, ultimo.mensajeId);
  return ctx.reply(mensajes.movimientoDeshecho(ultimo), HTML);
}

async function corregirUltimo(ctx, usuarioId, cambios, texto) {
  const ultimo = ultimoValido(ctx.chat.id);
  if (!ultimo) return ctx.reply(mensajes.sinMovimientoReciente, HTML);


  if (cambios.cuentaMencionada && !cambios.cuenta) {
    return ctx.reply(mensajes.noExiste('cuenta', cambios.cuentaMencionada), HTML);
  }
  if (cambios.cuentaDestinoMencionada && !cambios.cuentaDestino && ultimo.tipo === 'transferencia') {
    return ctx.reply(mensajes.noExiste('cuenta', cambios.cuentaDestinoMencionada), HTML);
  }
  if (cambios.categoriaMencionada && !cambios.categoria) {
    return ctx.reply(mensajes.noExiste('categoría', cambios.categoriaMencionada), HTML);
  }


  const nuevo = { ...ultimo };
  let huboCambio = false;

  if (cambios.monto) {
    nuevo.monto = cambios.monto;
    huboCambio = true;
  }
  if (cambios.cuenta) {
    nuevo.cuentaId = cambios.cuenta.id;
    nuevo.cuentaNombre = cambios.cuenta.nombre;
    huboCambio = true;
  }
  if (cambios.cuentaDestino && ultimo.tipo === 'transferencia') {
    nuevo.cuentaDestinoId = cambios.cuentaDestino.id;
    nuevo.cuentaDestinoNombre = cambios.cuentaDestino.nombre;
    huboCambio = true;
  }
  if (cambios.categoria) {
    if (ultimo.tipo !== 'gasto') return ctx.reply(mensajes.sinCategoria(ultimo.tipo), HTML);
    nuevo.categoriaId = cambios.categoria.id;
    nuevo.categoriaNombre = cambios.categoria.nombre;
    huboCambio = true;
  }
  // La descripción solo se cambia si el usuario la nombra, para que la IA no la pise por error.
  const pideDescripcion = /descrip|concepto|nota/.test(conversacion.limpiar(texto));
  if (cambios.descripcion && pideDescripcion && ultimo.tipo !== 'transferencia') {
    nuevo.descripcion = cambios.descripcion;
    huboCambio = true;
  }

  if (!huboCambio) return ctx.reply(mensajes.nadaQueCorregir, HTML);

  try {
    await editarMovimiento(usuarioId, nuevo);
  } catch (error) {
    if (error.status) return ctx.reply(mensajes.noEntendido(error.message), HTML);
    throw error;
  }

  const resumen = mensajes.movimientoRegistrado({
    tipo: nuevo.tipo,
    monto: nuevo.monto,
    descripcion: nuevo.descripcion,
    cuenta: nuevo.cuentaNombre,
    cuentaOrigen: nuevo.cuentaNombre,
    cuentaDestino: nuevo.cuentaDestinoNombre,
    categoria: nuevo.categoriaNombre,
  }, true);

  await quitarBotones(ctx, ultimo.mensajeId);
  const teclado = new InlineKeyboard().text('↩️ Deshacer', `deshacer:${nuevo.tipo}:${nuevo.id}`);
  const enviado = await ctx.reply(resumen, { ...HTML, reply_markup: teclado });
  ultimoPorChat.set(ctx.chat.id, { ...nuevo, mensajeId: enviado.message_id, creadoEn: Date.now() });
}


async function preguntar(ctx, preguntaId, pendiente, fase, texto, teclado) {
  pendiente.fase = fase;
  pendiente.chatId = ctx.chat.id;
  guardarPendiente(ctx.chat.id, preguntaId, pendiente);

  const opciones = teclado ? { ...HTML, reply_markup: teclado } : HTML;
  const enviado = await ctx.reply(texto, opciones);
  pendiente.mensajeId = enviado.message_id;
}


async function continuar(ctx, preguntaId, pendiente) {
  if (!pendiente.monto) {
    return preguntar(
      ctx, preguntaId, pendiente, 'monto',
      '💬 ¿De cuánto fue? Escríbelo, por ejemplo <code>20000</code> o <code>20 mil</code>.',
      null,
    );
  }

  if (!pendiente.cuentaId) {
    pendiente.fase = 'cuenta';
    const texto = pendiente.tipo === 'transferencia' ? '¿Desde cuál cuenta sale?' : '¿Con cuál cuenta fue?';
    return preguntar(
      ctx, preguntaId, pendiente, 'cuenta',
      `${texto} Toca una opción o escribe el nombre.`,
      tecladoCuentas(preguntaId, cuentasParaFase(pendiente)),
    );
  }

  if (pendiente.tipo === 'transferencia' && !pendiente.cuentaDestinoId) {
    pendiente.fase = 'cuentaDestino';
    return preguntar(
      ctx, preguntaId, pendiente, 'cuentaDestino',
      '¿Hacia cuál cuenta va? Toca una opción o escribe el nombre.',
      tecladoCuentas(preguntaId, cuentasParaFase(pendiente)),
    );
  }

  if (pendiente.tipo === 'gasto' && pendiente.categoriaId === undefined) {
    return preguntar(
      ctx, preguntaId, pendiente, 'categoria',
      '¿En qué categoría lo registro? Toca una opción o escribe el nombre.',
      tecladoCategorias(preguntaId, pendiente.categoriasDisponibles),
    );
  }

  cerrarPendiente(ctx.chat.id, preguntaId);
  try {
    await guardarYResponder(ctx, pendiente);
  } catch (error) {
    if (error.status) {
      return ctx.reply(mensajes.noEntendido(error.message), HTML);
    }
    throw error;
  }
}


async function responderPreguntaPorTexto(ctx, usuarioId, texto) {
  const activo = pendienteActivo(ctx.chat.id);
  if (!activo) return false;

  const { preguntaId, pendiente } = activo;
  if (pendiente.usuarioId !== usuarioId) return false;


  if (conversacion.esCancelacion(texto)) {
    cerrarPendiente(ctx.chat.id, preguntaId);
    await actualizarMensajePregunta(ctx, pendiente, '🚫 Pregunta cancelada.');
    await ctx.reply(mensajes.cancelado, HTML);
    return true;
  }

  let confirmacion;

  if (pendiente.fase === 'monto') {
    const monto = conversacion.extraerMonto(texto);
    if (!monto) return false;
    pendiente.monto = monto;
    confirmacion = `✅ Monto: ${mensajes.formatoPesos(monto)}`;
  } else {
    if (conversacion.contieneMonto(texto)) return false;

    if (pendiente.fase === 'categoria') {
      if (conversacion.esSinCategoria(texto)) {
        aplicarCategoria(pendiente, null);
      } else {
        const categoria = conversacion.elegirOpcion(texto, pendiente.categoriasDisponibles);
        if (!categoria) return false;
        aplicarCategoria(pendiente, categoria);
      }
      confirmacion = `✅ Categoría: ${mensajes.escapar(pendiente.categoriaNombre || 'Sin categoría')}`;
    } else {
      const cuenta = conversacion.elegirOpcion(texto, cuentasParaFase(pendiente));
      if (!cuenta) return false;
      confirmacion = etiquetaCuenta(pendiente, cuenta);
      aplicarCuenta(pendiente, cuenta);
    }
  }

  await actualizarMensajePregunta(ctx, pendiente, confirmacion);
  await continuar(ctx, preguntaId, pendiente);
  return true;
}


async function responderSinMovimiento(ctx, r, nombre, usuarioId, texto) {
  if (r.intencion === 'deshacer') return deshacerUltimo(ctx, usuarioId);

  if (r.intencion === 'corregir') {
    const abierta = pendienteActivo(ctx.chat.id);
    if (abierta) return ctx.reply(mensajes.recordatorioPregunta(abierta.pendiente.fase), HTML);
    return corregirUltimo(ctx, usuarioId, r.cambios, texto);
  }

  if (r.intencion === 'saludo') return ctx.reply(mensajes.saludo(nombre), HTML);
  if (r.intencion === 'agradecimiento') return ctx.reply(mensajes.agradecimiento(), HTML);
  if (r.intencion === 'ayuda') return ctx.reply(mensajes.formatos(r.cuentasDisponibles), HTML);


  const activo = pendienteActivo(ctx.chat.id);
  if (activo) return ctx.reply(mensajes.recordatorioPregunta(activo.pendiente.fase), HTML);

  return ctx.reply(mensajes.noEntendido(), HTML);
}


async function procesarTexto(ctx, usuarioId, texto, nombre) {
  if (texto.length > LARGO_MAXIMO_MENSAJE) {
    return ctx.reply('🤏 Ese mensaje es muy largo. Cuéntamelo más corto, en una sola frase.', HTML);
  }

  if (!dentroDelLimite(ctx.chat.id)) {
    return ctx.reply('🐢 Vas muy rápido, dame un momento y vuelve a intentarlo.', HTML);
  }


  if (await responderPreguntaPorTexto(ctx, usuarioId, texto)) return;


  const r = await interpretacionService.interpretar(usuarioId, texto, ultimoValido(ctx.chat.id));

  if (!r.reconocido) return responderSinMovimiento(ctx, r, nombre, usuarioId, texto);


  await descartarPreguntaActiva(ctx);

  const preguntaId = crypto.randomBytes(4).toString('hex');
  const pendiente = {
    usuarioId,
    creadoEn: Date.now(),
    tipo: r.tipo,
    monto: r.monto,
    descripcion: r.descripcion,
    fecha: r.fecha,
    cuentaId: r.cuenta?.id ?? null,
    cuentaNombre: r.cuenta?.nombre ?? null,
    cuentaDestinoId: r.tipo === 'transferencia' ? (r.cuentaDestino?.id ?? null) : null,
    cuentaDestinoNombre: r.tipo === 'transferencia' ? (r.cuentaDestino?.nombre ?? null) : null,
    categoriaId: r.tipo === 'gasto' ? (r.categoria?.id ?? undefined) : null,
    categoriaNombre: r.tipo === 'gasto' ? (r.categoria?.nombre ?? null) : null,
    cuentasDisponibles: r.cuentasDisponibles,
    categoriasDisponibles: r.categoriasDisponibles,
  };

  return continuar(ctx, preguntaId, pendiente);
}

async function manejarDeshacer(ctx, usuarioId, tipo, id) {
  try {
    await eliminarMovimiento(usuarioId, tipo, id);
    if (ultimoPorChat.get(ctx.chat.id)?.id === id) ultimoPorChat.delete(ctx.chat.id);

    await ctx.answerCallbackQuery();
    await ctx.editMessageText('↩️ Movimiento deshecho.', SIN_TECLADO);
  } catch (error) {
    if (error.status === 404) {
      return ctx.answerCallbackQuery({ text: 'Ese movimiento ya no existe.' });
    }
    await ctx.answerCallbackQuery({ text: 'No pude deshacerlo, intenta de nuevo.' });
  }
}

async function manejarBoton(ctx) {
  const partes = ctx.callbackQuery.data.split(':');
  const accion = partes[0];

  const usuario = await telegramService.usuarioPorChat(ctx.chat.id);
  if (!usuario) {
    return ctx.answerCallbackQuery({ text: 'Tu cuenta ya no está vinculada.' });
  }

  if (accion === 'deshacer') {
    const [, tipo, id] = partes;
    return manejarDeshacer(ctx, usuario.id, tipo, id);
  }

  const [, preguntaId, valor] = partes;
  const pendiente = pendientes.get(preguntaId);

  if (!pendiente || pendiente.usuarioId !== usuario.id) {
    return ctx.answerCallbackQuery({ text: 'Esto ya expiró, escribe el mensaje de nuevo.' });
  }

  if (pendienteVencido(pendiente)) {
    cerrarPendiente(ctx.chat.id, preguntaId);
    return ctx.answerCallbackQuery({ text: 'Esta pregunta ya venció, escribe el mensaje de nuevo.' });
  }

  try {
    if (accion === 'cuenta') {
      const cuenta = pendiente.cuentasDisponibles.find((c) => c.id === valor);
      if (!cuenta) return ctx.answerCallbackQuery({ text: 'Esa opción ya no es válida.' });

      const confirmacion = etiquetaCuenta(pendiente, cuenta);
      aplicarCuenta(pendiente, cuenta);
      await ctx.answerCallbackQuery();
      await ctx.editMessageText(confirmacion, SIN_TECLADO);
      return continuar(ctx, preguntaId, pendiente);
    }

    if (accion === 'categoria') {
      if (valor === 'ninguna') {
        aplicarCategoria(pendiente, null);
      } else {
        const categoria = pendiente.categoriasDisponibles.find((c) => c.id === valor);
        if (!categoria) return ctx.answerCallbackQuery({ text: 'Esa opción ya no es válida.' });
        aplicarCategoria(pendiente, categoria);
      }
      await ctx.answerCallbackQuery();
      await ctx.editMessageText(`✅ Categoría: ${mensajes.escapar(pendiente.categoriaNombre || 'Sin categoría')}`, SIN_TECLADO);
      return continuar(ctx, preguntaId, pendiente);
    }

    return ctx.answerCallbackQuery();
  } catch (error) {
    await ctx.answerCallbackQuery({ text: 'Algo salió mal, intenta de nuevo.' });
    throw error;
  }
}

module.exports = { procesarTexto, manejarBoton };