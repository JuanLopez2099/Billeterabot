const supabase = require('../config/supabaseClient');
const { errorValidacion } = require('../utils/errores');

const PREDEFINIDAS = [
  { nombre: 'Alimentación', icono: 'alimentacion', color: '#c9a227' },
  { nombre: 'Transporte', icono: 'transporte', color: '#35618c' },
  { nombre: 'Servicios', icono: 'servicios', color: '#7a7a6e' },
  { nombre: 'Ocio', icono: 'ocio', color: '#1f5c3f' },
  { nombre: 'Cuidado personal', icono: 'cuidado-personal', color: '#8a4a63' },
];

const ICONOS_VALIDOS = [
  'alimentacion', 'transporte', 'servicios', 'ocio', 'cuidado-personal',
  'hogar', 'salud', 'educacion', 'mascotas', 'ropa', 'tecnologia',
  'viajes', 'regalos', 'otros',
];

const COLORES_VALIDOS = [
  '#1f5c3f', '#b3413a', '#35618c', '#c9a227', '#7a7a6e', '#6c4f8a',
  '#5c8a6e', '#a85c32', '#4a7c8c', '#8a4a63', '#94792c', '#3d5a99',
];

const CAMPOS = 'id, nombre, es_predefinida, color, icono';

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

function validarColor(color) {
  if (!COLORES_VALIDOS.includes(color)) {
    throw errorValidacion('El color seleccionado no es válido');
  }
  return color;
}

function validarIcono(icono) {
  if (!ICONOS_VALIDOS.includes(icono)) {
    throw errorValidacion('El ícono seleccionado no es válido');
  }
  return icono;
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

  const filas = PREDEFINIDAS.map(({ nombre, icono, color }) => ({
    usuario_id: usuarioId,
    nombre,
    es_predefinida: true,
    icono,
    color,
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

async function crearCategoria(usuarioId, { nombre, color, icono }) {
  const nombreLimpio = validarNombre(nombre);
  const colorValido = validarColor(color);
  const iconoValido = validarIcono(icono);

  const { data, error } = await supabase
    .from('categorias')
    .insert([{
      usuario_id: usuarioId,
      nombre: nombreLimpio,
      es_predefinida: false,
      color: colorValido,
      icono: iconoValido,
    }])
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

async function editarCategoria(usuarioId, categoriaId, { nombre, color, icono }) {
  const nombreLimpio = validarNombre(nombre);
  const colorValido = validarColor(color);
  const iconoValido = validarIcono(icono);

  const { data, error } = await supabase
    .from('categorias')
    .update({ nombre: nombreLimpio, color: colorValido, icono: iconoValido })
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