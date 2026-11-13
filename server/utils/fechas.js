const MAX_DIAS_ATRAS = 365;
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const MESES = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7,
  agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

const DIAS_SEMANA = {
  domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6,
};

const NUMEROS = {
  un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, veinte: 20,
};

function fechaDeHoy() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
}

function esFechaValida(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const d = new Date(fecha + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === fecha;
}

function aUtc(iso) {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return Date.UTC(anio, mes - 1, dia);
}

function sumarDias(iso, dias) {
  return new Date(aUtc(iso) + dias * 86_400_000).toISOString().slice(0, 10);
}

function diferenciaDias(desde, hasta) {
  return Math.round((aUtc(hasta) - aUtc(desde)) / 86_400_000);
}

function armarFecha(anio, mes, dia) {
  const iso = `${String(anio).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  return esFechaValida(iso) ? iso : null;
}

function normalizarTexto(valor) {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9/\- ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function mesDePalabra(palabra) {
  if (palabra.length < 3) return null;
  const nombre = Object.keys(MESES).find((m) => m.startsWith(palabra));
  return nombre ? MESES[nombre] : null;
}

function anioCompleto(valor) {
  const anio = Number(valor);
  return anio < 100 ? 2000 + anio : anio;
}

function diaDeSemana(iso) {
  return new Date(aUtc(iso)).getUTCDay();
}

function diaDelMes(texto, hoy) {
  const dia = Number(texto);
  const [anioHoy, mesHoy] = hoy.split('-').map(Number);

  for (let atras = 0; atras < 12; atras += 1) {
    const indice = anioHoy * 12 + (mesHoy - 1) - atras;
    const iso = armarFecha(Math.floor(indice / 12), (indice % 12) + 1, dia);
    if (iso && iso <= hoy) return iso;
  }
  return null;
}

function interpretarExpresion(texto, hoy) {
  if (/\b(hoy|esta manana|esta tarde|esta noche|rato|ratico|momento)\b/.test(texto)) return hoy;
  if (/\banoche\b/.test(texto)) return sumarDias(hoy, -1);
  if (/\b(anteayer|antier|antes de ayer)\b/.test(texto)) return sumarDias(hoy, -2);
  if (/\bayer\b/.test(texto)) return sumarDias(hoy, -1);

  if (/\b(manana|proximo|proxima|siguiente|dentro de)\b/.test(texto) || /futur/.test(texto)) return 'futura';

  const hace = texto.match(/\bhace (\d+|[a-z]+) (dia|dias|semana|semanas)\b/);
  if (hace) {
    const cantidad = /^\d+$/.test(hace[1]) ? Number(hace[1]) : NUMEROS[hace[1]];
    if (!cantidad) return null;
    return sumarDias(hoy, -cantidad * (hace[2].startsWith('semana') ? 7 : 1));
  }

  const [anioHoy] = hoy.split('-').map(Number);

  for (const m of texto.matchAll(/(\d{1,2})\s*(?:de\s+)?([a-z]{3,})(?:\s*(?:de\s+)?(\d{4}))?/g)) {
    const mes = mesDePalabra(m[2]);
    if (!mes) continue;
    const dia = Number(m[1]);

    if (m[3]) return armarFecha(Number(m[3]), mes, dia);

    const esteAnio = armarFecha(anioHoy, mes, dia);
    if (esteAnio && esteAnio <= hoy) return esteAnio;
    return armarFecha(anioHoy - 1, mes, dia);
  }

  const numerica = texto.match(/(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/);
  if (numerica) {
    const dia = Number(numerica[1]);
    const mes = Number(numerica[2]);
    if (numerica[3]) return armarFecha(anioCompleto(numerica[3]), mes, dia);

    const esteAnio = armarFecha(anioHoy, mes, dia);
    if (esteAnio && esteAnio <= hoy) return esteAnio;
    return armarFecha(anioHoy - 1, mes, dia);
  }

  const semana = texto.match(/\b(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/);
  if (semana) {
    const objetivo = DIAS_SEMANA[semana[1]];
    const hoyDia = diaDeSemana(hoy);

    if (/\bsemana (pasada|anterior)\b/.test(texto)) {
      const lunesPasado = sumarDias(hoy, -((hoyDia + 6) % 7) - 7);
      return sumarDias(lunesPasado, (objetivo + 6) % 7);
    }

    const atras = (hoyDia - objetivo + 7) % 7 || 7;
    return sumarDias(hoy, -atras);
  }

  const soloDia = texto.match(/^(?:el |dia |el dia )?(\d{1,2})$/);
  if (soloDia) return diaDelMes(soloDia[1], hoy);

  return null;
}

function resolverFecha(valor, hoy = fechaDeHoy()) {
  const original = typeof valor === 'string' ? valor.trim() : '';
  if (!original) return { fecha: null, error: null };

  const resultado = esFechaValida(original) ? original : interpretarExpresion(normalizarTexto(original), hoy);

  if (resultado === 'futura') return { fecha: null, error: 'futura' };
  if (!resultado) return { fecha: null, error: 'invalida' };
  if (resultado > hoy) return { fecha: null, error: 'futura' };
  if (diferenciaDias(resultado, hoy) > MAX_DIAS_ATRAS) return { fecha: null, error: 'antigua' };

  return { fecha: resultado, error: null };
}

function describirFecha(iso, hoy = fechaDeHoy()) {
  const atras = diferenciaDias(iso, hoy);
  if (atras === 0) return 'hoy';
  if (atras === 1) return 'ayer';
  if (atras === 2) return 'anteayer';

  const [anio, mes, dia] = iso.split('-').map(Number);
  const sufijo = anio === Number(hoy.slice(0, 4)) ? '' : ` ${anio}`;
  return `${dia} ${MESES_CORTOS[mes - 1]}${sufijo}`;
}

module.exports = {
  fechaDeHoy,
  esFechaValida,
  sumarDias,
  diferenciaDias,
  resolverFecha,
  describirFecha,
};