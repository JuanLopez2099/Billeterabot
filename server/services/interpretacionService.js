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
      // La coincidencia parcial solo se usa si ambos nombres tienen 3 letras o más.
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

async function interpretar(usuarioId, texto) {
  const [cuentas, categorias] = await Promise.all([
    cuentaService.listarCuentas(usuarioId),
    categoriaService.listarCategorias(usuarioId),
  ]);

  const interpretado = await groqService.interpretarMensaje(texto, { cuentas, categorias });


  if (interpretado.intencion !== 'registrar' || interpretado.tipo === 'ninguno') {
    const intencion = interpretado.intencion === 'registrar' ? 'desconocido' : interpretado.intencion;
    return { reconocido: false, intencion, cuentasDisponibles: cuentas };
  }

  // El monto puede faltar: en ese caso el bot se lo pregunta al usuario.
  const montoNum = Math.round(Number(interpretado.monto));
  const monto = Number.isFinite(montoNum) && montoNum > 0 ? montoNum : null;

  return {
    reconocido: true,
    intencion: 'registrar',
    tipo: interpretado.tipo,
    monto,
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