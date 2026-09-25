const supabase = require('../config/supabaseClient');

async function listarCuentas() {
  const { data, error } = await supabase
    .from('cuentas')
    .select('id, nombre')
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data;
}

module.exports = { listarCuentas };