const supabase = require('../config/supabaseClient');
const { errorValidacion } = require('../utils/errores');
const { normalizar } = require('../utils/texto');

const COLORES_VALIDOS = [
  '#1f5c3f', '#b3413a', '#35618c', '#c9a227', '#7a7a6e', '#6c4f8a',
  '#5c8a6e', '#a85c32', '#4a7c8c', '#8a4a63', '#94792c', '#3d5a99',
];

const CAMPOS = 'id, nombre, color, usuario_id';

function errorConEstado(mensaje, status) {
  const err = new Error(mensaje);
  err.status = status;
  return err;
}

function validarNombre(nombre) {
  const limpio = typeof nombre === 'string' ? nombre.trim() : '';
  if (!limpio) {
    throw errorValidacion('El nombre de la cuenta es obligatorio');
  }
  if (limpio.length > 40) {
    throw errorValidacion('El nombre no puede superar los 40 caracteres');
  }
  return limpio;
}

function validarColor(color) {
  if (!COLORES_VALIDOS.includes(color)) {
    throw errorValidacion('El color seleccionado no es válido');
  }
  return color;
}


function aRespuesta(cuenta, usuarioId) {
  return {
    id: cuenta.id,
    nombre: cuenta.nombre,
    color: cuenta.color,
    es_propia: cuenta.usuario_id === usuarioId,
  };
}


async function listarCuentas(usuarioId) {
  if (!usuarioId) {
    throw new Error('listarCuentas necesita el id del usuario');
  }

  const { data, error } = await supabase
    .from('cuentas')
    .select(CAMPOS)
    .or(`usuario_id.is.null,usuario_id.eq.${usuarioId}`)
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data.map((c) => aRespuesta(c, usuarioId));
}


async function cuentaEsAccesible(usuarioId, cuentaId) {
  const { data, error } = await supabase
    .from('cuentas')
    .select('id')
    .eq('id', cuentaId)
    .or(`usuario_id.is.null,usuario_id.eq.${usuarioId}`)
    .maybeSingle();

  if (error) {
    if (error.code === '22P02') return false; // el id ni siquiera tiene formato de uuid
    throw error;
  }
  return Boolean(data);
}

async function exigirCuentaAccesible(usuarioId, cuentaId, mensaje = 'La cuenta indicada no existe') {
  if (!(await cuentaEsAccesible(usuarioId, cuentaId))) {
    throw errorValidacion(mensaje);
  }
}

async function crearCuenta(usuarioId, { nombre, color }) {
  const nombreLimpio = validarNombre(nombre);
  const colorValido = validarColor(color);


  const existentes = await listarCuentas(usuarioId);
  if (existentes.some((c) => normalizar(c.nombre) === normalizar(nombreLimpio))) {
    throw errorConEstado('Ya existe una cuenta con ese nombre', 409);
  }

  const { data, error } = await supabase
    .from('cuentas')
    .insert([{ usuario_id: usuarioId, nombre: nombreLimpio, color: colorValido }])
    .select(CAMPOS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw errorConEstado('Ya existe una cuenta con ese nombre', 409);
    }
    throw error;
  }

  return aRespuesta(data, usuarioId);
}

async function contarMovimientos(cuentaId) {
  const resultados = await Promise.all([
    supabase.from('gastos').select('id', { count: 'exact', head: true }).eq('cuenta_id', cuentaId),
    supabase.from('ingresos').select('id', { count: 'exact', head: true }).eq('cuenta_id', cuentaId),
    supabase
      .from('transferencias')
      .select('id', { count: 'exact', head: true })
      .or(`cuenta_origen_id.eq.${cuentaId},cuenta_destino_id.eq.${cuentaId}`),
  ]);

  let total = 0;
  for (const resultado of resultados) {
    if (resultado.error) throw resultado.error;
    total += resultado.count || 0;
  }
  return total;
}

async function eliminarCuenta(usuarioId, cuentaId) {
  const { data: cuenta, error } = await supabase
    .from('cuentas')
    .select('id, usuario_id')
    .eq('id', cuentaId)
    .maybeSingle();

  if (error) {
    if (error.code === '22P02') {
      throw errorConEstado('Cuenta no encontrada', 404);
    }
    throw error;
  }

 
  if (!cuenta || (cuenta.usuario_id && cuenta.usuario_id !== usuarioId)) {
    throw errorConEstado('Cuenta no encontrada', 404);
  }

  if (!cuenta.usuario_id) {
    throw errorConEstado('Las cuentas predefinidas no se pueden eliminar', 403);
  }

  const total = await contarMovimientos(cuenta.id);
  if (total > 0) {
    const texto = total === 1 ? '1 movimiento' : `${total} movimientos`;
    throw errorConEstado(`Esta cuenta tiene ${texto} y no se puede eliminar`, 409);
  }

  const { error: errorBorrar } = await supabase
    .from('cuentas')
    .delete()
    .eq('id', cuenta.id)
    .eq('usuario_id', usuarioId);

  if (errorBorrar) {
    // Red de seguridad: si entre el conteo y el borrado aparece un movimiento, la base lo impide.
    if (errorBorrar.code === '23503') {
      throw errorConEstado('Esta cuenta tiene movimientos y no se puede eliminar', 409);
    }
    throw errorBorrar;
  }
}

module.exports = { listarCuentas, crearCuenta, eliminarCuenta, exigirCuentaAccesible };