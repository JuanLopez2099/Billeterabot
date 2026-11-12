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
      if (real.length < 3 || buscado.length < 3) return false;
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

function montoValido(valor) {
  const numero = Math.round(Number(valor));
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

async function interpretar(usuarioId, texto, ultimo = null) {
  const [cuentas, categorias] = await Promise.all([
    cuentaService.listarCuentas(usuarioId),
    categoriaService.listarCategorias(usuarioId),
  ]);

  const interpretado = await groqService.interpretarMensaje(texto, { cuentas, categorias, ultimo });

  if (interpretado.intencion === 'corregir') {
    return {
      reconocido: false,
      intencion: 'corregir',
      cambios: {
        monto: montoValido(interpretado.monto),
        cuenta: buscarCuenta(interpretado.cuenta, cuentas),
        cuentaMencionada: interpretado.cuenta || null,
        cuentaDestino: buscarCuenta(interpretado.cuentaDestino, cuentas),
        cuentaDestinoMencionada: interpretado.cuentaDestino || null,
        categoria: buscarCategoria(interpretado.categoria, categorias),
        categoriaMencionada: interpretado.categoria || null,
        descripcion: interpretado.descripcion || null,
      },
      cuentasDisponibles: cuentas,
      categoriasDisponibles: categorias,
    };
  }

  if (interpretado.intencion !== 'registrar' || interpretado.tipo === 'ninguno') {
    const intencion = interpretado.intencion === 'registrar' ? 'desconocido' : interpretado.intencion;
    return {
      reconocido: false,
      intencion,
      nombre: interpretado.nombre || null,
      cuentasDisponibles: cuentas,
      categoriasDisponibles: categorias,
    };
  }

  const monto = montoValido(interpretado.monto);

  return {
    reconocido: true,
    intencion: 'registrar',
    tipo: interpretado.tipo,
    monto,
    descripcion: interpretado.descripcion || null,
    fecha: fechaDeHoy(),
    cuenta: buscarCuenta(interpretado.cuenta, cuentas),
    cuentaMencionada: interpretado.cuenta || null,
    cuentaDestino: interpretado.tipo === 'transferencia' ? buscarCuenta(interpretado.cuentaDestino, cuentas) : null,
    cuentaDestinoMencionada: interpretado.tipo === 'transferencia' ? interpretado.cuentaDestino || null : null,
    categoria: interpretado.tipo === 'gasto' ? buscarCategoria(interpretado.categoria, categorias) : null,
    categoriaMencionada: interpretado.tipo === 'gasto' ? interpretado.categoria || null : null,
    cuentasDisponibles: cuentas,
    categoriasDisponibles: categorias,
  };
}

module.exports = { interpretar };