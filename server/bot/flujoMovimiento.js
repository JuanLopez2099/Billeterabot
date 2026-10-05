// server/bot/flujoMovimiento.js
const { InlineKeyboard } = require('grammy');
const interpretacionService = require('../services/interpretacionService');
const ingresoService = require('../services/ingresoService');
const gastoService = require('../services/gastoService');
const transferenciaService = require('../services/transferenciaService');
const mensajes = require('./mensajes');

const HTML = { parse_mode: 'HTML' };
const SIN_TECLADO = { parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } };

const pendientes = new Map();


const ultimos = new Map();

function tecladoCuentas(cuentas) {
  const teclado = new InlineKeyboard();
  cuentas.forEach((c, i) => {
    teclado.text(c.nombre, `cuenta:${c.id}`);
    if (i % 2 === 1) teclado.row();
  });
  return teclado;
}

function tecladoCategorias(categorias) {
  const teclado = new InlineKeyboard();
  categorias.forEach((c, i) => {
    teclado.text(c.nombre, `categoria:${c.id}`);
    if (i % 2 === 1) teclado.row();
  });
  teclado.row().text('Sin categoría', 'categoria:ninguna');
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

  ultimos.set(ctx.chat.id, { tipo, id: registro.id, usuarioId });

  const resumen = mensajes.movimientoRegistrado({
    tipo,
    fechaToken: pendiente.fechaToken,
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


async function continuar(ctx, pendiente) {
  if (!pendiente.cuentaId) {
    pendiente.fase = 'cuenta';
    pendientes.set(ctx.chat.id, pendiente);
    return ctx.reply('¿Con cuál cuenta fue?', { ...HTML, reply_markup: tecladoCuentas(pendiente.cuentasDisponibles) });
  }

  if (pendiente.tipo === 'transferencia' && !pendiente.cuentaDestinoId) {
    pendiente.fase = 'cuentaDestino';
    pendientes.set(ctx.chat.id, pendiente);
    return ctx.reply('¿Hacia cuál cuenta?', { ...HTML, reply_markup: tecladoCuentas(pendiente.cuentasDisponibles) });
  }

  if (pendiente.tipo === 'gasto' && pendiente.categoriaId === undefined) {
    pendiente.fase = 'categoria';
    pendientes.set(ctx.chat.id, pendiente);
    return ctx.reply('¿En qué categoría la registro?', { ...HTML, reply_markup: tecladoCategorias(pendiente.categoriasDisponibles) });
  }

  pendientes.delete(ctx.chat.id);
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
  const r = await interpretacionService.interpretar(usuarioId, texto);

  if (!r.reconocido) {
    return ctx.reply(mensajes.noEntendido(), HTML);
  }

  const pendiente = {
    usuarioId,
    tipo: r.tipo,
    monto: r.monto,
    descripcion: r.descripcion,
    fecha: r.fecha,
    fechaToken: r.fechaToken,
    cuentaId: r.cuenta?.id ?? null,
    cuentaNombre: r.cuenta?.nombre ?? null,
    cuentaDestinoId: r.tipo === 'transferencia' ? (r.cuentaDestino?.id ?? null) : null,
    cuentaDestinoNombre: r.tipo === 'transferencia' ? (r.cuentaDestino?.nombre ?? null) : null,
    categoriaId: r.tipo === 'gasto' ? (r.categoria?.id ?? undefined) : null,
    categoriaNombre: r.tipo === 'gasto' ? (r.categoria?.nombre ?? null) : null,
    cuentasDisponibles: r.cuentasDisponibles,
    categoriasDisponibles: r.categoriasDisponibles,
  };

  return continuar(ctx, pendiente);
}

async function manejarDeshacer(ctx, tipo, id) {
  const ultimo = ultimos.get(ctx.chat.id);
  if (!ultimo || ultimo.tipo !== tipo || ultimo.id !== id) {
    return ctx.answerCallbackQuery({ text: 'Ese movimiento ya no se puede deshacer.' });
  }

  try {
    if (tipo === 'gasto') await gastoService.eliminarGasto(ultimo.usuarioId, id);
    else if (tipo === 'ingreso') await ingresoService.eliminarIngreso(ultimo.usuarioId, id);
    else await transferenciaService.eliminarTransferencia(ultimo.usuarioId, id);

    ultimos.delete(ctx.chat.id);
    await ctx.answerCallbackQuery();
    await ctx.editMessageText('↩️ Movimiento deshecho.', SIN_TECLADO);
  } catch {
    await ctx.answerCallbackQuery({ text: 'No pude deshacerlo, intenta de nuevo.' });
  }
}

async function manejarBoton(ctx) {
  const partes = ctx.callbackQuery.data.split(':');
  const accion = partes[0];

  if (accion === 'deshacer') {
    const [, tipo, id] = partes;
    return manejarDeshacer(ctx, tipo, id);
  }

  const valor = partes[1];
  const pendiente = pendientes.get(ctx.chat.id);
  if (!pendiente) {
    return ctx.answerCallbackQuery({ text: 'Esto ya expiró, intenta de nuevo.' });
  }

  if (accion === 'cuenta') {
    const cuenta = pendiente.cuentasDisponibles.find((c) => c.id === valor);
    if (pendiente.fase === 'cuentaDestino') {
      pendiente.cuentaDestinoId = cuenta.id;
      pendiente.cuentaDestinoNombre = cuenta.nombre;
    } else {
      pendiente.cuentaId = cuenta.id;
      pendiente.cuentaNombre = cuenta.nombre;
    }
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(`✅ Cuenta: ${mensajes.escapar(cuenta.nombre)}`, SIN_TECLADO);
    return continuar(ctx, pendiente);
  }

  if (accion === 'categoria') {
    if (valor === 'ninguna') {
      pendiente.categoriaId = null;
      pendiente.categoriaNombre = null;
    } else {
      const categoria = pendiente.categoriasDisponibles.find((c) => c.id === valor);
      pendiente.categoriaId = categoria.id;
      pendiente.categoriaNombre = categoria.nombre;
    }
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(`✅ Categoría: ${mensajes.escapar(pendiente.categoriaNombre || 'Sin categoría')}`, SIN_TECLADO);
    return continuar(ctx, pendiente);
  }
}

module.exports = { procesarTexto, manejarBoton };