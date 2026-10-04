const { Bot } = require('grammy');
const telegramService = require('../services/telegramService');
const cuentaService = require('../services/cuentaService');
const mensajes = require('./mensajes');

const HTML = { parse_mode: 'HTML' };

let usernameDelBot = null;

function obtenerUsernameDelBot() {
  return usernameDelBot;
}

function fijarUsernameDelBot(username) {
  usernameDelBot = username;
}

function crearBot(token, opciones = {}) {
  const bot = new Bot(token, opciones);


  bot.use(async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      console.error('Error en el bot de Telegram:', error?.message || error);
      try {
        await ctx.reply(mensajes.errorTemporal);
      } catch {
        // Si ni siquiera se puede avisar, no hay más que hacer
      }
    }
  });


  bot.use(async (ctx, next) => {
    if (ctx.chat && ctx.chat.type !== 'private') return;
    await next();
  });


  bot.command('start', async (ctx) => {
    const codigo = ctx.match.trim();

    if (codigo) {
      const resultado = await telegramService.vincularChat(codigo, ctx.chat.id);
      if (!resultado.ok) {
        const texto = resultado.motivo === 'chat_ocupado' ? mensajes.chatOcupado : mensajes.codigoInvalido;
        return ctx.reply(texto, HTML);
      }
      const [usuario, cuentas] = await Promise.all([
        telegramService.usuarioPorChat(ctx.chat.id),
        cuentaService.listarCuentas(),
      ]);
      return ctx.reply(mensajes.vinculado(usuario?.nombre, cuentas), HTML);
    }

    const usuario = await telegramService.usuarioPorChat(ctx.chat.id);
    if (!usuario) return ctx.reply(mensajes.sinVincular(), HTML);

    const cuentas = await cuentaService.listarCuentas();
    return ctx.reply(mensajes.bienvenidaDeNuevo(usuario.nombre, cuentas), HTML);
  });

  // /ayuda -> vuelve a mostrar los formatos sugeridos
  bot.command('ayuda', async (ctx) => {
    const cuentas = await cuentaService.listarCuentas();
    return ctx.reply(mensajes.formatos(cuentas), HTML);
  });


  bot.on('message:text', async (ctx) => {
    const usuario = await telegramService.usuarioPorChat(ctx.chat.id);
    if (!usuario) return ctx.reply(mensajes.sinVincular(), HTML);
    return ctx.reply(mensajes.proximamente, HTML);
  });


  bot.catch((error) => {
    console.error('Error inesperado en el bot de Telegram:', error.error?.message || error.message);
  });

  return bot;
}


async function iniciarBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log('Bot de Telegram desactivado: falta TELEGRAM_BOT_TOKEN en el .env');
    return null;
  }

  const bot = crearBot(token);
  await bot.init(); 
  fijarUsernameDelBot(bot.botInfo.username);


  bot
    .start({
      drop_pending_updates: true,
      onStart: (info) => console.log(`Bot de Telegram activo: @${info.username}`),
    })
    .catch((err) => console.error('El bot de Telegram se detuvo:', err.message));

  return bot;
}

module.exports = { crearBot, iniciarBot, obtenerUsernameDelBot, fijarUsernameDelBot };