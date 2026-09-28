const supabase = require('../config/supabaseClient');
const { errorValidacion } = require('../utils/errores');
const { fechaDeHoy, esFechaValida } = require('../utils/fechas');

const CAMPOS = 'id, monto, descripcion, fecha, creado_en, cuenta:cuentas(id, nombre), categoria:categorias(id, nombre)';

function errorConEstado(mensaje, status) {
  const err = new Error(mensaje);
  err.status = status;
  return err;
}

async function categoriaPerteneceAlUsuario(usuarioId, categoriaId) {
  const { data, error } = await supabase
    .from('categorias')
    .select('id')
    .eq('id', categoriaId)
    .eq('usuario_id', usuarioId)
    .maybeSingle(); 

  if (error) throw error;
  return Boolean(data);
}

async function crearGasto(usuarioId, { monto, cuentaId, categoriaId, descripcion, fecha }) {
  const montoNum = Number(monto);
  if (!Number.isInteger(montoNum) || montoNum <= 0) {
    throw errorValidacion('El monto debe ser un número entero mayor que 0');
  }

  if (!cuentaId) {
    throw errorValidacion('La cuenta es obligatoria');
  }


  const categoriaFinal = categoriaId || null;
  if (categoriaFinal) {
    const esDelUsuario = await categoriaPerteneceAlUsuario(usuarioId, categoriaFinal);
    if (!esDelUsuario) {
      throw errorValidacion('La categoría indicada no existe');
    }
  }

  const fechaFinal = fecha || fechaDeHoy();
  if (!esFechaValida(fechaFinal)) {
    throw errorValidacion('La fecha debe tener el formato AAAA-MM-DD y ser válida');
  }
  if (fechaFinal > fechaDeHoy()) {
    throw errorValidacion('La fecha no puede ser futura');
  }

  const { data, error } = await supabase
    .from('gastos')
    .insert([{
      usuario_id: usuarioId,
      cuenta_id: cuentaId,
      categoria_id: categoriaFinal,
      monto: montoNum,
      descripcion: descripcion ? String(descripcion).trim() : null,
      fecha: fechaFinal,
    }])
    .select(CAMPOS)
    .single();

  if (error) {
    if (error.code === '22P02' || error.code === '23503') {
      throw errorValidacion('La cuenta indicada no existe');
    }
    throw error;
  }

  return data;
}

async function listarGastos(usuarioId, orden = 'desc') {
  const ascendente = orden === 'asc';

  const { data, error } = await supabase
    .from('gastos')
    .select(CAMPOS)
    .eq('usuario_id', usuarioId)
    .order('fecha', { ascending: ascendente })
    .order('creado_en', { ascending: ascendente });

  if (error) throw error;
  return data;
}

async function editarGasto(usuarioId, gastoId, { monto, cuentaId, categoriaId, descripcion, fecha }) {
  const montoNum = Number(monto);
  if (!Number.isInteger(montoNum) || montoNum <= 0) {
    throw errorValidacion('El monto debe ser un número entero mayor que 0');
  }

  if (!cuentaId) {
    throw errorValidacion('La cuenta es obligatoria');
  }

  const categoriaFinal = categoriaId || null;
  if (categoriaFinal) {
    const esDelUsuario = await categoriaPerteneceAlUsuario(usuarioId, categoriaFinal);
    if (!esDelUsuario) {
      throw errorValidacion('La categoría indicada no existe');
    }
  }

  const fechaFinal = fecha || fechaDeHoy();
  if (!esFechaValida(fechaFinal)) {
    throw errorValidacion('La fecha debe tener el formato AAAA-MM-DD y ser válida');
  }
  if (fechaFinal > fechaDeHoy()) {
    throw errorValidacion('La fecha no puede ser futura');
  }

  const { data, error } = await supabase
    .from('gastos')
    .update({
      cuenta_id: cuentaId,
      categoria_id: categoriaFinal,
      monto: montoNum,
      descripcion: descripcion ? String(descripcion).trim() : null,
      fecha: fechaFinal,
    })
    .eq('id', gastoId)
    .eq('usuario_id', usuarioId)
    .select(CAMPOS);

  if (error) {
    if (error.code === '22P02' || error.code === '23503') {
      throw errorValidacion('La cuenta indicada no existe');
    }
    throw error;
  }

  if (data.length === 0) {
    throw errorConEstado('Gasto no encontrado', 404);
  }

  return data[0];
}

async function eliminarGasto(usuarioId, gastoId) {
  const { data, error } = await supabase
    .from('gastos')
    .delete()
    .eq('id', gastoId)
    .eq('usuario_id', usuarioId)
    .select();

  if (error) throw error;

  if (data.length === 0) {
    throw errorConEstado('Gasto no encontrado', 404);
  }
}

module.exports = { crearGasto, listarGastos, editarGasto, eliminarGasto };