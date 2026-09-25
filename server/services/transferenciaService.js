const supabase = require('../config/supabaseClient');
const { errorValidacion } = require('../utils/errores');

function fechaDeHoy() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
}

function esFechaValida(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const d = new Date(fecha + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === fecha;
}
async function crearTransferencia(usuarioId, { monto, cuentaOrigenId, cuentaDestinoId, fecha }) {
  const montoNum = Number(monto);
  if (!Number.isInteger(montoNum) || montoNum <= 0) {
    throw errorValidacion('El monto debe ser un número entero mayor que 0');
  }

  if (!cuentaOrigenId || !cuentaDestinoId) {
    throw errorValidacion('La cuenta de origen y la de destino son obligatorias');
  }

  if (cuentaOrigenId === cuentaDestinoId) {
    throw errorValidacion('La cuenta de origen y la de destino deben ser diferentes');
  }

  const fechaFinal = fecha || fechaDeHoy();
  if (!esFechaValida(fechaFinal)) {
    throw errorValidacion('La fecha debe tener el formato AAAA-MM-DD y ser válida');
  }
  if (fechaFinal > fechaDeHoy()) {
    throw errorValidacion('La fecha no puede ser futura');
  }

  const { data, error } = await supabase
    .from('transferencias')
    .insert([{
      usuario_id: usuarioId,
      cuenta_origen_id: cuentaOrigenId,
      cuenta_destino_id: cuentaDestinoId,
      monto: montoNum,
      fecha: fechaFinal,
    }])
    .select(`
      id, monto, fecha, creado_en,
      cuenta_origen:cuentas!cuenta_origen_id(id, nombre),
      cuenta_destino:cuentas!cuenta_destino_id(id, nombre)
    `)
    .single();

  if (error) {
    if (error.code === '22P02' || error.code === '23503') {
      throw errorValidacion('Alguna de las cuentas indicadas no existe');
    }
    throw error;
  }

  return data;
}

async function listarTransferencias(usuarioId, orden = 'desc') {
  const ascendente = orden === 'asc';

  const { data, error } = await supabase
    .from('transferencias')
    .select(`
      id, monto, fecha, creado_en,
      cuenta_origen:cuentas!cuenta_origen_id(id, nombre),
      cuenta_destino:cuentas!cuenta_destino_id(id, nombre)
    `)
    .eq('usuario_id', usuarioId)
    .order('fecha', { ascending: ascendente })
    .order('creado_en', { ascending: ascendente });

  if (error) throw error;
  return data;
}

async function editarTransferencia(usuarioId, transferenciaId, { monto, cuentaOrigenId, cuentaDestinoId, fecha }) {
  const montoNum = Number(monto);
  if (!Number.isInteger(montoNum) || montoNum <= 0) {
    throw errorValidacion('El monto debe ser un número entero mayor que 0');
  }

  if (!cuentaOrigenId || !cuentaDestinoId) {
    throw errorValidacion('La cuenta de origen y la de destino son obligatorias');
  }

  if (cuentaOrigenId === cuentaDestinoId) {
    throw errorValidacion('La cuenta de origen y la de destino deben ser diferentes');
  }

  const fechaFinal = fecha || fechaDeHoy();
  if (!esFechaValida(fechaFinal)) {
    throw errorValidacion('La fecha debe tener el formato AAAA-MM-DD y ser válida');
  }
  if (fechaFinal > fechaDeHoy()) {
    throw errorValidacion('La fecha no puede ser futura');
  }

  const { data, error } = await supabase
    .from('transferencias')
    .update({
      cuenta_origen_id: cuentaOrigenId,
      cuenta_destino_id: cuentaDestinoId,
      monto: montoNum,
      fecha: fechaFinal,
    })
    .eq('id', transferenciaId)
    .eq('usuario_id', usuarioId)
    .select(`
      id, monto, fecha, creado_en,
      cuenta_origen:cuentas!cuenta_origen_id(id, nombre),
      cuenta_destino:cuentas!cuenta_destino_id(id, nombre)
    `);

  if (error) {
    if (error.code === '22P02' || error.code === '23503') {
      throw errorValidacion('Alguna de las cuentas indicadas no existe');
    }
    throw error;
  }

  if (data.length === 0) {
    const err = new Error('Transferencia no encontrada');
    err.status = 404;
    throw err;
  }

  return data[0];
}

async function eliminarTransferencia(usuarioId, transferenciaId) {
  const { data, error } = await supabase
    .from('transferencias')
    .delete()
    .eq('id', transferenciaId)
    .eq('usuario_id', usuarioId)
    .select();

  if (error) throw error;

  if (data.length === 0) {
    const err = new Error('Transferencia no encontrada');
    err.status = 404;
    throw err;
  }
}

module.exports = { crearTransferencia, listarTransferencias, editarTransferencia, eliminarTransferencia };