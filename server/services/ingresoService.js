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

async function crearIngreso(usuarioId, { monto, cuentaId, descripcion, fecha }) {
  const montoNum = Number(monto);
  if (!Number.isInteger(montoNum) || montoNum <= 0) {
    throw errorValidacion('El monto debe ser un número entero mayor que 0');
  }

  if (!cuentaId) {
    throw errorValidacion('La cuenta es obligatoria');
  }

  const fechaFinal = fecha || fechaDeHoy();

  if (!esFechaValida(fechaFinal)) {
    throw errorValidacion('La fecha debe tener el formato AAAA-MM-DD y ser válida');
  }

  if (fechaFinal > fechaDeHoy()) {
    throw errorValidacion('La fecha no puede ser futura');
  }

  const { data, error } = await supabase
    .from('ingresos')
    .insert([{
      usuario_id: usuarioId,
      cuenta_id: cuentaId,
      monto: montoNum,
      descripcion: descripcion ? String(descripcion).trim() : null,
      fecha: fechaFinal,
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '22P02' || (error.code === '23503' && error.message.includes('cuenta_id'))) {
      throw errorValidacion('La cuenta indicada no existe');
    }
    throw error;
  }

  return data;
}

async function listarIngresos(usuarioId, orden = 'desc') {
  const ascendente = orden === 'asc';

  const { data, error } = await supabase
    .from('ingresos')
    .select('id, monto, descripcion, fecha, creado_en, cuenta:cuentas(id, nombre)')
    .eq('usuario_id', usuarioId)
    .order('fecha', { ascending: ascendente })
    .order('creado_en', { ascending: ascendente });

  if (error) throw error;
  return data;
}

async function editarIngreso(usuarioId, ingresoId, { monto, cuentaId, descripcion, fecha }) {
  const montoNum = Number(monto);
  if (!Number.isInteger(montoNum) || montoNum <= 0) {
    throw errorValidacion('El monto debe ser un número entero mayor que 0');
  }

  if (!cuentaId) {
    throw errorValidacion('La cuenta es obligatoria');
  }

  const fechaFinal = fecha || fechaDeHoy();

  if (!esFechaValida(fechaFinal)) {
    throw errorValidacion('La fecha debe tener el formato AAAA-MM-DD y ser válida');
  }

  if (fechaFinal > fechaDeHoy()) {
    throw errorValidacion('La fecha no puede ser futura');
  }

  const { data, error } = await supabase
    .from('ingresos')
    .update({
      cuenta_id: cuentaId,
      monto: montoNum,
      descripcion: descripcion ? String(descripcion).trim() : null,
      fecha: fechaFinal,
    })
    .eq('id', ingresoId)
    .eq('usuario_id', usuarioId)
    .select();

  if (error) {
    if (error.code === '22P02' || (error.code === '23503' && error.message.includes('cuenta_id'))) {
      throw errorValidacion('La cuenta indicada no existe');
    }
    throw error;
  }

  if (data.length === 0) {
    const err = new Error('Ingreso no encontrado');
    err.status = 404;
    throw err;
  }

  return data[0];
}

async function eliminarIngreso(usuarioId, ingresoId) {
  const { data, error } = await supabase
    .from('ingresos')
    .delete()
    .eq('id', ingresoId)
    .eq('usuario_id', usuarioId)
    .select();

  if (error) throw error;

  if (data.length === 0) {
    const err = new Error('Ingreso no encontrado');
    err.status = 404;
    throw err;
  }
}

module.exports = { crearIngreso, listarIngresos, editarIngreso, eliminarIngreso };