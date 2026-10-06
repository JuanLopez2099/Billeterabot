const crypto = require('crypto');
const supabase = require('../config/supabaseClient');


const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LARGO_CODIGO = 8;
const MINUTOS_DE_VALIDEZ = 10;
const FORMATO_CODIGO = /^[A-HJ-NP-Z2-9]{8}$/;

function nuevoCodigo() {
  const bytes = crypto.randomBytes(LARGO_CODIGO);
  return Array.from(bytes, (byte) => ALFABETO[byte % ALFABETO.length]).join('');
}


async function generarCodigo(usuarioId) {
  
  const sinUsar = await supabase
    .from('codigos_vinculacion')
    .delete()
    .eq('usuario_id', usuarioId)
    .eq('usado', false);
  if (sinUsar.error) throw sinUsar.error;

  const vencidos = await supabase
    .from('codigos_vinculacion')
    .delete()
    .lt('expira_en', new Date().toISOString());
  if (vencidos.error) throw vencidos.error;

  const expiraEn = new Date(Date.now() + MINUTOS_DE_VALIDEZ * 60 * 1000).toISOString();

  for (let intento = 0; intento < 3; intento++) {
    const codigo = nuevoCodigo();
    const { error } = await supabase
      .from('codigos_vinculacion')
      .insert({ codigo, usuario_id: usuarioId, expira_en: expiraEn });

    if (!error) return { codigo, expiraEn };
    if (error.code !== '23505') throw error; 
  }
  throw new Error('No se pudo generar un código único');
}


async function vincularChat(codigoTexto, chatId) {
  const codigo = String(codigoTexto || '').trim().toUpperCase();
  if (!FORMATO_CODIGO.test(codigo)) return { ok: false, motivo: 'codigo_invalido' };


  const consumo = await supabase
    .from('codigos_vinculacion')
    .update({ usado: true })
    .eq('codigo', codigo)
    .eq('usado', false)
    .gt('expira_en', new Date().toISOString())
    .select('usuario_id');
  if (consumo.error) throw consumo.error;
  if (!consumo.data || consumo.data.length === 0) return { ok: false, motivo: 'codigo_invalido' };

  const usuarioId = consumo.data[0].usuario_id;

  // Un chat solo puede pertenecer a un usuario
  const ocupante = await supabase
    .from('usuarios')
    .select('id')
    .eq('telegram_chat_id', chatId)
    .maybeSingle();
  if (ocupante.error) throw ocupante.error;
  if (ocupante.data && ocupante.data.id !== usuarioId) return { ok: false, motivo: 'chat_ocupado' };

  const guardado = await supabase
    .from('usuarios')
    .update({ telegram_chat_id: chatId })
    .eq('id', usuarioId);
  if (guardado.error) {
    if (guardado.error.code === '23505') return { ok: false, motivo: 'chat_ocupado' };
    throw guardado.error;
  }

  return { ok: true, usuarioId };
}

async function usuarioPorChat(chatId) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre')
    .eq('telegram_chat_id', chatId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function estadoVinculacion(usuarioId) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('telegram_chat_id')
    .eq('id', usuarioId)
    .maybeSingle();
  if (error) throw error;
  return { vinculado: Boolean(data && data.telegram_chat_id) };
}

async function desvincular(usuarioId) {
  const { error } = await supabase
    .from('usuarios')
    .update({ telegram_chat_id: null })
    .eq('id', usuarioId);
  if (error) throw error;
}

module.exports = { generarCodigo, vincularChat, usuarioPorChat, estadoVinculacion, desvincular };