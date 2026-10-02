const supabase = require('../config/supabaseClient');
const { fechaDeHoy } = require('../utils/fechas');

function inicioDeMes() {
  return fechaDeHoy().slice(0, 7) + '-01';
}

function sumar(filas) {
  return filas.reduce((acumulado, fila) => acumulado + fila.monto, 0);
}

async function calcularResumen(usuarioId) {
  const inicio = inicioDeMes();
  const hoy = fechaDeHoy();

  const [ingresosTotal, gastosTotal, gastosDelMes, transferenciasDelMes, ingresosDelMes] = await Promise.all([
    supabase.from('ingresos').select('monto').eq('usuario_id', usuarioId),
    supabase.from('gastos').select('monto').eq('usuario_id', usuarioId),
    supabase.from('gastos').select('monto, categoria:categorias(nombre, color, icono)').eq('usuario_id', usuarioId).gte('fecha', inicio).lte('fecha', hoy),
    supabase.from('transferencias').select('id').eq('usuario_id', usuarioId).gte('fecha', inicio).lte('fecha', hoy),
    supabase.from('ingresos').select('id').eq('usuario_id', usuarioId).gte('fecha', inicio).lte('fecha', hoy),
  ]);

  for (const resultado of [ingresosTotal, gastosTotal, gastosDelMes, transferenciasDelMes, ingresosDelMes]) {
    if (resultado.error) throw resultado.error;
  }

  const saldoDisponible = sumar(ingresosTotal.data) - sumar(gastosTotal.data);
  const gastadoEsteMes = sumar(gastosDelMes.data);
  const movimientos = gastosDelMes.data.length + transferenciasDelMes.data.length + ingresosDelMes.data.length;

  // Agrupar por nombre, guardando el color y el ícono reales de esa categoría
  const porCategoria = {};
  for (const gasto of gastosDelMes.data) {
    const nombre = gasto.categoria?.nombre || 'Sin categoría';
    const color = gasto.categoria?.color || '#7a7a6e';
    const icono = gasto.categoria?.icono || 'otros';
    if (!porCategoria[nombre]) {
      porCategoria[nombre] = { monto: 0, color, icono };
    }
    porCategoria[nombre].monto += gasto.monto;
  }

  const distribucionCategoria = Object.entries(porCategoria)
    .map(([nombre, { monto, color, icono }]) => ({
      nombre,
      monto,
      color,
      icono,
      porcentaje: gastadoEsteMes > 0 ? Math.round((monto / gastadoEsteMes) * 100) : 0,
    }))
    .sort((a, b) => b.monto - a.monto);

  return { saldoDisponible, gastadoEsteMes, movimientos, distribucionCategoria, mes: inicio.slice(0, 7) };
}

module.exports = { calcularResumen };