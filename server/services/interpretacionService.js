const { normalizar } = require('../utils/texto');
const { fechaDeHoy, resolverFecha } = require('../utils/fechas');
const { resolverPeriodo } = require('../utils/periodos');
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

const MAXIMO_ADICIONALES = 4;

function montoValido(valor) {
  const numero = Math.round(Number(valor));
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

function construirMovimiento(datos, cuentas, categorias) {
  const fecha = resolverFecha(datos.fecha);
  const esTransferencia = datos.tipo === 'transferencia';
  const esGasto = datos.tipo === 'gasto';

  return {
    tipo: datos.tipo,
    monto: montoValido(datos.monto),
    descripcion: datos.descripcion || null,
    fecha: fecha.fecha || fechaDeHoy(),
    errorFecha: fecha.error,
    cuenta: buscarCuenta(datos.cuenta, cuentas),
    cuentaMencionada: datos.cuenta || null,
    cuentaDestino: esTransferencia ? buscarCuenta(datos.cuentaDestino, cuentas) : null,
    cuentaDestinoMencionada: esTransferencia ? datos.cuentaDestino || null : null,
    categoria: esGasto ? buscarCategoria(datos.categoria, categorias) : null,
    categoriaMencionada: esGasto ? datos.categoria || null : null,
  };
}

async function interpretar(usuarioId, texto, ultimo = null) {
  const [cuentas, categorias] = await Promise.all([
    cuentaService.listarCuentas(usuarioId),
    categoriaService.listarCategorias(usuarioId),
  ]);

  const interpretado = await groqService.interpretarMensaje(texto, { cuentas, categorias, ultimo });

  if (interpretado.intencion === 'corregir') {
    const fechaCambio = resolverFecha(interpretado.fecha);
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
        fecha: fechaCambio.fecha,
        errorFecha: fechaCambio.error,
      },
      cuentasDisponibles: cuentas,
      categoriasDisponibles: categorias,
    };
  }

  if (interpretado.intencion === 'consultar') {
    return {
      reconocido: false,
      intencion: 'consultar',
      consulta: interpretado.consulta,
      periodo: resolverPeriodo(interpretado.periodo),
      cuenta: buscarCuenta(interpretado.cuenta, cuentas),
      cuentaMencionada: interpretado.cuenta || null,
      categoria: buscarCategoria(interpretado.categoria, categorias),
      categoriaMencionada: interpretado.categoria || null,
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

  const adicionales = (interpretado.adicionales || [])
    .slice(0, MAXIMO_ADICIONALES)
    .map((datos) => construirMovimiento(datos, cuentas, categorias))
    .filter((movimiento) => movimiento.monto);

  return {
    reconocido: true,
    intencion: 'registrar',
    ...construirMovimiento(interpretado, cuentas, categorias),
    adicionales,
    cuentasDisponibles: cuentas,
    categoriasDisponibles: categorias,
  };
}

module.exports = { interpretar };