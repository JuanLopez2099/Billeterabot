// server/bot/flujoMovimiento.js
const crypto = require('crypto');
const { InlineKeyboard } = require('grammy');
const interpretacionService = require('../services/interpretacionService');
const telegramService = require('../services/telegramService');
const ingresoService = require('../services/ingresoService');
const gastoService = require('../services/gastoService');
const transferenciaService = require('../services/transferenciaService');
const mensajes = require('./mensajes');

const HTML = { parse_mode: 'HTML' };
const SIN_TECLADO = { parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } };

const LARGO_MAXIMO_MENSAJE = 300;
const MENSAJES_POR_MINUTO = 10;
const VENCIMIENTO_PREGUNTA_MS = 10 * 60 * 1000;


const pendientes = new Map();


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
  await ctx.reply(resumen, { ...HTML, reply_markup: teclado });
}

async function continuar(ctx, preguntaId, pendiente) {
  if (!pendiente.cuentaId) {
    pendiente.fase = 'cuenta';
    pendientes.set(preguntaId, pendiente);
    return ctx.reply('¿Con cuál cuenta fue?', { ...HTML, reply_markup: tecladoCuentas(preguntaId, pendiente.cuentasDisponibles) });
  }

  if (pendiente.tipo === 'transferencia' && !pendiente.cuentaDestinoId) {
    pendiente.fase = 'cuentaDestino';
    pendientes.set(preguntaId, pendiente);
    return ctx.reply('¿Hacia cuál cuenta?', { ...HTML, reply_markup: tecladoCuentas(preguntaId, pendiente.cuentasDisponibles) });
  }

  if (pendiente.tipo === 'gasto' && pendiente.categoriaId === undefined) {
    pendiente.fase = 'categoria';
    pendientes.set(preguntaId, pendiente);
    return ctx.reply('¿En qué categoría la registro?', { ...HTML, reply_markup: tecladoCategorias(preguntaId, pendiente.categoriasDisponibles) });
  }

  pendientes.delete(preguntaId);
  try {
    await guardarYResponder(ctx, pendiente);
  } catch (error) {
    if (error.status) {
      return ctx.reply(mensajes.noEntendido(error.message), HTML);
    }
    throw error;
  }
}

async function procesarTexto(ctx, usuarioId, texto) {
  if (texto.length > LARGO_MAXIMO_MENSAJE) {
    return ctx.reply('🤏 Ese mensaje es muy largo. Cuéntamelo más corto, en una sola frase.', HTML);
  }

  if (!dentroDelLimite(ctx.chat.id)) {
    return ctx.reply('🐢 Vas muy rápido, dame un momento y vuelve a intentarlo.', HTML);
  }

  const r = await interpretacionService.interpretar(usuarioId, texto);

  if (!r.reconocido) {
    return ctx.reply(mensajes.noEntendido(), HTML);
  }

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
    if (tipo === 'gasto') await gastoService.eliminarGasto(usuarioId, id);
    else if (tipo === 'ingreso') await ingresoService.eliminarIngreso(usuarioId, id);
    else await transferenciaService.eliminarTransferencia(usuarioId, id);

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
    pendientes.delete(preguntaId);
    return ctx.answerCallbackQuery({ text: 'Esta pregunta ya venció, escribe el mensaje de nuevo.' });
  }

  try {
    if (accion === 'cuenta') {
      const cuenta = pendiente.cuentasDisponibles.find((c) => c.id === valor);
      if (!cuenta) return ctx.answerCallbackQuery({ text: 'Esa opción ya no es válida.' });

      if (pendiente.fase === 'cuentaDestino') {
        pendiente.cuentaDestinoId = cuenta.id;
        pendiente.cuentaDestinoNombre = cuenta.nombre;
      } else {
        pendiente.cuentaId = cuenta.id;
        pendiente.cuentaNombre = cuenta.nombre;
      }
      await ctx.answerCallbackQuery();
      await ctx.editMessageText(`✅ Cuenta: ${mensajes.escapar(cuenta.nombre)}`, SIN_TECLADO);
      return continuar(ctx, preguntaId, pendiente);
    }

    if (accion === 'categoria') {
      if (valor === 'ninguna') {
        pendiente.categoriaId = null;
        pendiente.categoriaNombre = null;
      } else {
        const categoria = pendiente.categoriasDisponibles.find((c) => c.id === valor);
        if (!categoria) return ctx.answerCallbackQuery({ text: 'Esa opción ya no es válida.' });
        pendiente.categoriaId = categoria.id;
        pendiente.categoriaNombre = categoria.nombre;
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