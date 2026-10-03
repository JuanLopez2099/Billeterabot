const supabase = require('../config/supabaseClient');
const { fechaDeHoy } = require('../utils/fechas');
const { errorValidacion } = require('../utils/errores');


function sumarMeses(mes, cantidad) {
  const [anio, numero] = mes.split('-').map(Number);
  return new Date(Date.UTC(anio, numero - 1 + cantidad, 1)).toISOString().slice(0, 7);
}

function diasDelMes(mes) {
  const [anio, numero] = mes.split('-').map(Number);
  return new Date(Date.UTC(anio, numero, 0)).getUTCDate();
}

function sumar(filas) {
  return filas.reduce((acumulado, fila) => acumulado + fila.monto, 0);
}

function acumuladoPorDia(filas, hasta) {
  const porDia = new Array(hasta).fill(0);
  for (const fila of filas) {
    const dia = Number(fila.fecha.slice(8, 10));
    if (dia <= hasta) porDia[dia - 1] += fila.monto;
  }
  let total = 0;
  return porDia.map((valor) => (total += valor));
}

function validarMes(mes, mesActual) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
    throw errorValidacion('El mes debe tener el formato AAAA-MM');
  }
  if (mes > mesActual) {
    throw errorValidacion('No puedes consultar un mes futuro');
  }
}

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const ORDEN_SEMANA = [1, 2, 3, 4, 5, 6, 0];

function diaDeLaSemana(fecha) {
  return new Date(fecha + 'T00:00:00Z').getUTCDay();
}

async function calcularResumen(usuarioId, mesPedido) {
  const hoy = fechaDeHoy();
  const mesActual = hoy.slice(0, 7);
  const mes = mesPedido || mesActual;
  validarMes(mes, mesActual);

  const esMesActual = mes === mesActual;
  const mesAnterior = sumarMeses(mes, -1);
  const diasMes = diasDelMes(mes);
  const diaCorte = esMesActual ? Number(hoy.slice(8, 10)) : diasMes;
  const inicioVentana = sumarMeses(mes, -5) + '-01';
  const fin = esMesActual ? hoy : `${mes}-${String(diasMes).padStart(2, '0')}`;

  const [
    ingresosTotal,
    gastosTotal,
    gastosVentana,
    ingresosVentana,
    transferenciasDelMes,
    transferenciasTotal,
    cuentasCatalogo,
  ] = await Promise.all([
    supabase.from('ingresos').select('monto, cuenta_id').eq('usuario_id', usuarioId),
    supabase.from('gastos').select('monto, cuenta_id').eq('usuario_id', usuarioId),
    supabase
      .from('gastos')
      .select('id, monto, fecha, descripcion, cuenta:cuentas(id, nombre), categoria:categorias(nombre, color, icono)')
      .eq('usuario_id', usuarioId)
      .gte('fecha', inicioVentana)
      .lte('fecha', fin),
    supabase
      .from('ingresos')
      .select('monto, fecha')
      .eq('usuario_id', usuarioId)
      .gte('fecha', inicioVentana)
      .lte('fecha', fin),
    supabase
      .from('transferencias')
      .select('id')
      .eq('usuario_id', usuarioId)
      .gte('fecha', `${mes}-01`)
      .lte('fecha', fin),
    supabase.from('transferencias').select('monto, cuenta_origen_id, cuenta_destino_id').eq('usuario_id', usuarioId),
    supabase.from('cuentas').select('id, nombre'),
  ]);

  for (const resultado of [
    ingresosTotal, gastosTotal, gastosVentana, ingresosVentana,
    transferenciasDelMes, transferenciasTotal, cuentasCatalogo,
  ]) {
    if (resultado.error) throw resultado.error;
  }

  const gastosDelMes = gastosVentana.data.filter((g) => g.fecha.startsWith(mes));
  const gastosMesAnterior = gastosVentana.data.filter((g) => g.fecha.startsWith(mesAnterior));
  const ingresosDelMes = ingresosVentana.data.filter((i) => i.fecha.startsWith(mes));

  const saldoDisponible = sumar(ingresosTotal.data) - sumar(gastosTotal.data);
  const gastadoEsteMes = sumar(gastosDelMes);
  const ingresosEsteMes = sumar(ingresosDelMes);
  const movimientos = gastosDelMes.length + ingresosDelMes.length + transferenciasDelMes.data.length;

  const balanceMes = ingresosEsteMes - gastadoEsteMes;
  const porcentajeAhorro = ingresosEsteMes > 0 ? Math.round((balanceMes / ingresosEsteMes) * 100) : null;

  const diasMesAnterior = diasDelMes(mesAnterior);
  const acumuladoActual = acumuladoPorDia(gastosDelMes, diaCorte);
  const acumuladoAnterior = acumuladoPorDia(gastosMesAnterior, diasMesAnterior);

  const gastoAcumulado = [];
  for (let dia = 1; dia <= diasMes; dia++) {
    gastoAcumulado.push({
      dia,
      actual: dia <= diaCorte ? acumuladoActual[dia - 1] : null,
      anterior: acumuladoAnterior[Math.min(dia, diasMesAnterior) - 1],
    });
  }

  const gastadoMesAnterior = acumuladoAnterior[Math.min(diaCorte, diasMesAnterior) - 1];
  const variacionGastos = gastadoMesAnterior > 0
    ? Math.round(((gastadoEsteMes - gastadoMesAnterior) / gastadoMesAnterior) * 100)
    : null;

  const promedioDiarioGasto = Math.round(gastadoEsteMes / diaCorte);

  const ingresosVsGastos = [];
  for (let i = 5; i >= 0; i--) {
    const m = sumarMeses(mes, -i);
    ingresosVsGastos.push({
      mes: m,
      ingresos: sumar(ingresosVentana.data.filter((x) => x.fecha.startsWith(m))),
      gastos: sumar(gastosVentana.data.filter((x) => x.fecha.startsWith(m))),
    });
  }

  const porCategoria = {};
  for (const gasto of gastosDelMes) {
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

  const nombrePorCuenta = {};
  for (const c of cuentasCatalogo.data) nombrePorCuenta[c.id] = c.nombre;

  const saldos = {};
  function sumarA(cuentaId, monto) {
    if (!cuentaId) return;
    saldos[cuentaId] = (saldos[cuentaId] || 0) + monto;
  }

  for (const i of ingresosTotal.data) sumarA(i.cuenta_id, i.monto);
  for (const g of gastosTotal.data) sumarA(g.cuenta_id, -g.monto);
  for (const t of transferenciasTotal.data) {
    sumarA(t.cuenta_origen_id, -t.monto);
    sumarA(t.cuenta_destino_id, t.monto);
  }

  const saldoPorCuenta = Object.entries(saldos)
    .map(([cuentaId, saldo]) => ({
      cuentaId,
      nombre: nombrePorCuenta[cuentaId] || 'Cuenta',
      saldo,
    }))
    .sort((a, b) => b.saldo - a.saldo);

  const topGastos = [...gastosDelMes]
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 5)
    .map((g) => ({
      id: g.id,
      monto: g.monto,
      descripcion: g.descripcion,
      fecha: g.fecha,
      cuenta: g.cuenta?.nombre || null,
      categoria: g.categoria
        ? { nombre: g.categoria.nombre, color: g.categoria.color, icono: g.categoria.icono }
        : null,
    }));


  const totalesPorDia = new Array(7).fill(0);
  for (const g of gastosDelMes) {
    totalesPorDia[diaDeLaSemana(g.fecha)] += g.monto;
  }
  const gastoPorDiaSemana = ORDEN_SEMANA.map((indice) => ({
    dia: DIAS_SEMANA[indice],
    monto: totalesPorDia[indice],
  }));

  return {
    mes,
    saldoDisponible,
    gastadoEsteMes,
    ingresosEsteMes,
    balanceMes,
    porcentajeAhorro,
    gastadoMesAnterior,
    variacionGastos,
    promedioDiarioGasto,
    movimientos,
    distribucionCategoria,
    ingresosVsGastos,
    gastoAcumulado,
    saldoPorCuenta,
    topGastos,
    gastoPorDiaSemana,
  };
}

module.exports = { calcularResumen };