const supabase = require('../config/supabaseClient');
const { errorValidacion } = require('../utils/errores');

const CATEGORIAS_PREDEFINIDAS = [
  'Alimentación',
  'Transporte',
  'Servicios',
  'Ocio',
  'Cuidado personal',
];

const CAMPOS = 'id, nombre, es_predefinida';

function validarNombre(nombre) {
  const limpio = typeof nombre === 'string' ? nombre.trim() : '';
  if (!limpio) {
    throw errorValidacion('El nombre de la categoría es obligatorio');
  }
  if (limpio.length > 40) {
    throw errorValidacion('El nombre no puede superar los 40 caracteres');
  }
  return limpio;
}

function errorConEstado(mensaje, status) {
  const err = new Error(mensaje);
  err.status = status;
  return err;
}

async function sembrarPredefinidasUnaVez(usuarioId) {
  const { data: usuario, error: errorUsuario } = await supabase
    .from('usuarios')
    .select('categorias_sembradas')
    .eq('id', usuarioId)
    .single();

  if (errorUsuario) throw errorUsuario;
  if (usuario.categorias_sembradas) return false;

  const filas = CATEGORIAS_PREDEFINIDAS.map((nombre) => ({
    usuario_id: usuarioId,
    nombre,
    es_predefinida: true,
  }));

  const { error: errorInsert } = await supabase
    .from('categorias')
    .upsert(filas, { onConflict: 'usuario_id,nombre', ignoreDuplicates: true });

  if (errorInsert) throw errorInsert;

  const { error: errorMarcar } = await supabase
    .from('usuarios')
    .update({ categorias_sembradas: true })
    .eq('id', usuarioId);

  if (errorMarcar) throw errorMarcar;

  return true;
}

async function listarCategorias(usuarioId) {
  const { data, error } = await supabase
    .from('categorias')
    .select(CAMPOS)
    .eq('usuario_id', usuarioId)
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data;
}

async function crearCategoria(usuarioId, { nombre }) {
  const nombreLimpio = validarNombre(nombre);

  const { data, error } = await supabase
    .from('categorias')
    .insert([{ usuario_id: usuarioId, nombre: nombreLimpio, es_predefinida: false }])
    .select(CAMPOS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw errorConEstado('Ya tienes una categoría con ese nombre', 409);
    }
    throw error;
  }

  return data;
}

async function editarCategoria(usuarioId, categoriaId, { nombre }) {
  const nombreLimpio = validarNombre(nombre);

  const { data, error } = await supabase
    .from('categorias')
    .update({ nombre: nombreLimpio })
    .eq('id', categoriaId)
    .eq('usuario_id', usuarioId)
    .select(CAMPOS);

  if (error) {
    if (error.code === '23505') {
      throw errorConEstado('Ya tienes una categoría con ese nombre', 409);
    }
    if (error.code === '22P02') {
      throw errorConEstado('Categoría no encontrada', 404);
    }
    throw error;
  }

  if (data.length === 0) {
    throw errorConEstado('Categoría no encontrada', 404);
  }

  return data[0];
}

async function eliminarCategoria(usuarioId, categoriaId) {
  const { data, error } = await supabase
    .from('categorias')
    .delete()
    .eq('id', categoriaId)
    .eq('usuario_id', usuarioId)
    .select();

  if (error) {
    if (error.code === '22P02') {
      throw errorConEstado('Categoría no encontrada', 404);
    }
    throw error;
  }

  if (data.length === 0) {
    throw errorConEstado('Categoría no encontrada', 404);
  }
}

module.exports = {
  sembrarPredefinidasUnaVez,
  listarCategorias,
  crearCategoria,
  editarCategoria,
  eliminarCategoria,
};