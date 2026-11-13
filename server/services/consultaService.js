const supabase = require('../config/supabaseClient');

const TAMANO_PAGINA = 1000;

async function traerTodas(construirConsulta) {
  const filas = [];
  for (let inicio = 0; ; inicio += TAMANO_PAGINA) {
    const { data, error } = await construirConsulta().range(inicio, inicio + TAMANO_PAGINA - 1);
    if (error) throw error;
    filas.push(...data);
    if (data.length < TAMANO_PAGINA) return filas;
  }
}

async function gastosDelPeriodo(usuarioId, { desde, hasta, cuentaId, categoriaId }) {
  return traerTodas(() => {
    let consulta = supabase
      .from('gastos')
      .select('id, monto, fecha, categoria:categorias(nombre)')
      .eq('usuario_id', usuarioId)
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha', { ascending: false })
      .order('id');
    if (cuentaId) consulta = consulta.eq('cuenta_id', cuentaId);
    if (categoriaId) consulta = consulta.eq('categoria_id', categoriaId);
    return consulta;
  });
}

async function ingresosDelPeriodo(usuarioId, { desde, hasta, cuentaId }) {
  return traerTodas(() => {
    let consulta = supabase
      .from('ingresos')
      .select('id, monto, fecha')
      .eq('usuario_id', usuarioId)
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha', { ascending: false })
      .order('id');
    if (cuentaId) consulta = consulta.eq('cuenta_id', cuentaId);
    return consulta;
  });
}

module.exports = { gastosDelPeriodo, ingresosDelPeriodo };