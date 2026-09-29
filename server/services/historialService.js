const supabase = require('../config/supabaseClient');

async function listarHistorial(usuarioId, limite = 20) {
  const [ingresos, gastos, transferencias] = await Promise.all([
    supabase
      .from('ingresos')
      .select('id, monto, descripcion, fecha, creado_en, cuenta:cuentas(id, nombre)')
      .eq('usuario_id', usuarioId),
    supabase
      .from('gastos')
      .select('id, monto, descripcion, fecha, creado_en, cuenta:cuentas(id, nombre), categoria:categorias(id, nombre)')
      .eq('usuario_id', usuarioId),
    supabase
      .from('transferencias')
      .select('id, monto, fecha, creado_en, cuenta_origen:cuentas!cuenta_origen_id(id, nombre), cuenta_destino:cuentas!cuenta_destino_id(id, nombre)')
      .eq('usuario_id', usuarioId),
  ]);

  for (const resultado of [ingresos, gastos, transferencias]) {
    if (resultado.error) throw resultado.error;
  }


  const combinado = [
    ...ingresos.data.map((m) => ({ ...m, tipo: 'ingreso' })),
    ...gastos.data.map((m) => ({ ...m, tipo: 'gasto' })),
    ...transferencias.data.map((m) => ({ ...m, tipo: 'transferencia' })),
  ];


  combinado.sort((a, b) => {
    if (a.fecha !== b.fecha) return a.fecha < b.fecha ? 1 : -1;
    return a.creado_en < b.creado_en ? 1 : -1;
  });

  return combinado.slice(0, limite);
}

module.exports = { listarHistorial };