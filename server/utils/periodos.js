const { normalizar } = require('./texto');
const { fechaDeHoy, sumarDias } = require('./fechas');

const MESES = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7,
  agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

const NOMBRES_MES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const NUMEROS = {
  un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6,
  siete: 7, ocho: 8, nueve: 9, diez: 10, quince: 15, veinte: 20, treinta: 30,
};

function dosDigitos(numero) {
  return String(numero).padStart(2, '0');
}

function ultimoDiaDelMes(anio, mes) {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

function mesCompleto(anio, mes) {
  return {
    desde: `${anio}-${dosDigitos(mes)}-01`,
    hasta: `${anio}-${dosDigitos(mes)}-${dosDigitos(ultimoDiaDelMes(anio, mes))}`,
  };
}

function diaDeSemana(iso) {
  return new Date(`${iso}T00:00:00Z`).getUTCDay();
}

function lunesDeLaSemana(iso) {
  return sumarDias(iso, -((diaDeSemana(iso) + 6) % 7));
}

function limpiarTexto(valor) {
  return normalizar(String(valor ?? ''))
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resultado(desde, hasta, etiqueta, hoy) {
  return { desde, hasta: hasta > hoy ? hoy : hasta, etiqueta, error: null };
}

function resolverPeriodo(expresion, hoy = fechaDeHoy()) {
  const texto = limpiarTexto(expresion);
  const anioActual = Number(hoy.slice(0, 4));
  const mesActual = Number(hoy.slice(5, 7));

  if (!texto) return resultado(`${hoy.slice(0, 7)}-01`, hoy, 'este mes', hoy);

  if (/\bhoy\b/.test(texto)) return resultado(hoy, hoy, 'hoy', hoy);

  if (/\banteayer\b/.test(texto)) {
    const dia = sumarDias(hoy, -2);
    return resultado(dia, dia, 'anteayer', hoy);
  }

  if (/\bayer\b/.test(texto)) {
    const dia = sumarDias(hoy, -1);
    return resultado(dia, dia, 'ayer', hoy);
  }

  if (/\bsemana (pasada|anterior)\b/.test(texto)) {
    const lunes = sumarDias(lunesDeLaSemana(hoy), -7);
    return resultado(lunes, sumarDias(lunes, 6), 'la semana pasada', hoy);
  }

  if (/\b(esta semana|semana actual)\b/.test(texto)) {
    return resultado(lunesDeLaSemana(hoy), hoy, 'esta semana', hoy);
  }

  if (/\bmes (pasado|anterior)\b/.test(texto)) {
    const anio = mesActual === 1 ? anioActual - 1 : anioActual;
    const mes = mesActual === 1 ? 12 : mesActual - 1;
    const { desde, hasta } = mesCompleto(anio, mes);
    return resultado(desde, hasta, 'el mes pasado', hoy);
  }

  if (/\bano (pasado|anterior)\b/.test(texto)) {
    return resultado(`${anioActual - 1}-01-01`, `${anioActual - 1}-12-31`, 'el año pasado', hoy);
  }

  if (/\b(este mes|mes actual|del mes)\b/.test(texto)) {
    return resultado(`${hoy.slice(0, 7)}-01`, hoy, 'este mes', hoy);
  }

  if (/\b(este ano|ano actual|del ano)\b/.test(texto)) {
    return resultado(`${anioActual}-01-01`, hoy, 'este año', hoy);
  }

  const ultimos = texto.match(/\bultim[oa]s? (\d+|[a-z]+)? ?(dias?|semanas?|meses|mes|semana)\b/);
  if (ultimos) {
    const cantidad = ultimos[1] ? (/^\d+$/.test(ultimos[1]) ? Number(ultimos[1]) : NUMEROS[ultimos[1]]) : 1;
    const unidad = ultimos[2];
    const factor = unidad.startsWith('semana') ? 7 : unidad.startsWith('mes') ? 30 : 1;
    const dias = cantidad * factor;
    if (!cantidad || dias > 365) return { desde: null, hasta: null, etiqueta: null, error: 'invalido' };
    return resultado(sumarDias(hoy, -(dias - 1)), hoy, `en los últimos ${dias} días`, hoy);
  }

  const nombreMes = Object.keys(MESES).find((m) => new RegExp(`\\b${m}\\b`).test(texto));
  if (nombreMes) {
    const numeroMes = MESES[nombreMes];
    const anioEscrito = texto.match(/\b(20\d{2})\b/);
    const anio = anioEscrito ? Number(anioEscrito[1]) : numeroMes > mesActual ? anioActual - 1 : anioActual;
    const { desde, hasta } = mesCompleto(anio, numeroMes);
    if (desde > hoy) return { desde: null, hasta: null, etiqueta: null, error: 'invalido' };
    const sufijo = anio === anioActual ? '' : ` de ${anio}`;
    return resultado(desde, hasta, `en ${NOMBRES_MES[numeroMes - 1]}${sufijo}`, hoy);
  }

  return { desde: null, hasta: null, etiqueta: null, error: 'invalido' };
}

module.exports = { resolverPeriodo };