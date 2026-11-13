const { normalizar } = require('./texto');

const PALETA_COLORES = [
  '#1f5c3f', '#b3413a', '#35618c', '#c9a227', '#7a7a6e', '#6c4f8a',
  '#5c8a6e', '#a85c32', '#4a7c8c', '#8a4a63', '#94792c', '#3d5a99',
];

function limpiar(texto = '') {
  return normalizar(String(texto))
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function numeroDesdeTexto(token) {
  const separadores = token.match(/[.,]/g) || [];
  if (separadores.length === 0) return Number(token);

  const ultimo = Math.max(token.lastIndexOf('.'), token.lastIndexOf(','));
  const despues = token.slice(ultimo + 1);

  if (despues.length === 3) return Number(token.replace(/[.,]/g, ''));
  if (separadores.length === 1) return Number(token.replace(',', '.'));

  return null;
}

const UNIDADES = {
  cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17,
  dieciocho: 18, diecinueve: 19, veinte: 20, veintiun: 21, veintiuno: 21, veintidos: 22, veintitres: 23,
  veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
  cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400, quinientos: 500,
  seiscientos: 600, setecientos: 700, ochocientos: 800, novecientos: 900,
};

function montoDesdePalabras(texto) {
  const palabras = limpiar(texto).split(' ').filter((p) => p && !['y', 'pesos', 'cop'].includes(p));
  if (palabras.length === 0) return null;

  let total = 0;
  let actual = 0;

  for (const palabra of palabras) {
    if (palabra === 'mil') {
      total += (actual || 1) * 1000;
      actual = 0;
    } else if (palabra === 'millon' || palabra === 'millones') {
      total += (actual || 1) * 1_000_000;
      actual = 0;
    } else if (Object.hasOwn(UNIDADES, palabra)) {
      actual += UNIDADES[palabra];
    } else {
      return null;
    }
  }

  total += actual;
  return total > 0 ? total : null;
}

function extraerMonto(texto) {
  const limpio = normalizar(String(texto)).replace(/\s+/g, ' ').replace(/^\$\s*/, '');
  const coincidencia = limpio.match(/^(\d[\d.,]*)\s*(mil|k|millon|millones)?\s*(pesos|cop)?$/);
  if (!coincidencia) return montoDesdePalabras(texto);

  const base = numeroDesdeTexto(coincidencia[1]);
  if (base === null) return null;

  const multiplicador = { mil: 1000, k: 1000, millon: 1_000_000, millones: 1_000_000 }[coincidencia[2]] || 1;
  const monto = Math.round(base * multiplicador);

  return Number.isFinite(monto) && monto > 0 ? monto : null;
}

function contieneMonto(texto) {
  const limpio = limpiar(texto);
  return /\d/.test(limpio) || /\bmil\b/.test(limpio);
}

function elegirOpcion(texto, opciones) {
  const buscado = limpiar(texto);
  if (!buscado || !opciones || opciones.length === 0) return null;

  const exacta = opciones.find((o) => limpiar(o.nombre) === buscado);
  if (exacta) return exacta;

  const dentro = opciones.filter((o) => ` ${buscado} `.includes(` ${limpiar(o.nombre)} `));
  if (dentro.length === 1) return dentro[0];
  if (dentro.length > 1) {
    const ordenadas = [...dentro].sort((a, b) => limpiar(b.nombre).length - limpiar(a.nombre).length);
    const mayor = limpiar(ordenadas[0].nombre);
    const todasAnidadas = ordenadas.slice(1).every((o) => mayor.includes(limpiar(o.nombre)));
    return todasAnidadas ? ordenadas[0] : null;
  }

  if (buscado.length >= 3) {
    const empiezan = opciones.filter((o) => limpiar(o.nombre).startsWith(buscado));
    if (empiezan.length === 1) return empiezan[0];

    const porPalabra = opciones.filter((o) => limpiar(o.nombre).split(' ').includes(buscado));
    if (porPalabra.length === 1) return porPalabra[0];
  }

  return null;
}

function coincideNombreExacto(texto, opciones) {
  const buscado = limpiar(texto);
  return Boolean(buscado) && (opciones || []).some((o) => limpiar(o.nombre) === buscado);
}

const SIN_CATEGORIA = new Set(['sin categoria', 'ninguna', 'ninguno', 'ninguna categoria', 'sin']);

function esSinCategoria(texto) {
  return SIN_CATEGORIA.has(limpiar(texto));
}

const CANCELAR = new Set([
  'no', 'nada', 'nada mas', 'mejor no', 'ya no', 'no importa',
  'dejalo', 'dejalo asi', 'olvidalo', 'olvida eso',
  'cancela', 'cancelar', 'cancelalo', 'cancela eso',
]);

function esCancelacion(texto) {
  const limpio = limpiar(texto);
  return CANCELAR.has(limpio) || /^cancel/.test(limpio) || /^olvid/.test(limpio);
}

function esAfirmacion(texto) {
  const limpio = limpiar(texto);
  return /^(si|sii|sip|dale|claro|ok|okay|vale|listo|hazlo|de una|obvio|correcto|por favor|porfa|yes)\b/.test(limpio)
    || /^crea/.test(limpio);
}

function esNegacion(texto) {
  return /^(no|nop|nope|nel|negativo|mejor no)\b/.test(limpiar(texto));
}

function capitalizar(texto) {
  const limpio = String(texto ?? '').trim().replace(/\s+/g, ' ');
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

function elegirColor(usados = []) {
  const libres = PALETA_COLORES.filter((c) => !usados.includes(c));
  const disponibles = libres.length > 0 ? libres : PALETA_COLORES;
  return disponibles[Math.floor(Math.random() * disponibles.length)];
}

module.exports = {
  limpiar,
  extraerMonto,
  contieneMonto,
  elegirOpcion,
  coincideNombreExacto,
  esSinCategoria,
  esCancelacion,
  esAfirmacion,
  esNegacion,
  capitalizar,
  elegirColor,
};