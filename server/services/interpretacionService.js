// server/services/interpretacionService.js
const { normalizar } = require('../utils/texto');
const { fechaDeHoy } = require('../utils/fechas');
const cuentaService = require('./cuentaService');
const categoriaService = require('./categoriaService');
const groqService = require('./groqService');

function buscarCuenta(nombreMencionado, cuentas) {
  if (!nombreMencionado) return null;
  const buscado = normalizar(nombreMencionado);
  return (
    cuentas.find((c) => normalizar(c.nombre) === buscado) ||
    cuentas.find((c) => {
      const real = normalizar(c.nombre);
      return real.includes(buscado) || buscado.includes(real);
    }) ||
    null
  );
}

function buscarCategoria(nombreMencionado, categorias) {
  if (!nombreMencionado) return null;
  const buscado = normalizar(nombreMencionado);
  return categorias.find((c) => normalizar(c.nombre) === buscado) || null;
}

async function interpretar(usuarioId, texto) {
  const [cuentas, categorias] = await Promise.all([
    cuentaService.listarCuentas(),
    categoriaService.listarCategorias(usuarioId),
  ]);

  const interpretado = await groqService.interpretarMensaje(texto, { cuentas, categorias });

  if (interpretado.tipo === 'desconocido') {
    return { reconocido: false };
  }

  const montoNum = Math.round(Number(interpretado.monto));
  if (!Number.isFinite(montoNum) || montoNum <= 0) {
    return { reconocido: false };
  }

  return {
    reconocido: true,
    tipo: interpretado.tipo,
    monto: montoNum,
    descripcion: interpretado.descripcion || null,
    fecha: fechaDeHoy(),
    cuenta: buscarCuenta(interpretado.cuenta, cuentas),
    cuentaDestino: interpretado.tipo === 'transferencia' ? buscarCuenta(interpretado.cuentaDestino, cuentas) : null,
    categoria: interpretado.tipo === 'gasto' ? buscarCategoria(interpretado.categoria, categorias) : null,
    cuentasDisponibles: cuentas,
    categoriasDisponibles: categorias,
  };
}

module.exports = { interpretar };