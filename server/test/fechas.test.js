const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  esFechaValida,
  sumarDias,
  diferenciaDias,
  resolverFecha,
  describirFecha,
} = require('../utils/fechas');

const HOY = '2026-11-18';

function fecha(expresion) {
  return resolverFecha(expresion, HOY);
}

test('AUT-17 esFechaValida acepta solo fechas reales en formato AAAA-MM-DD', () => {
  assert.equal(esFechaValida('2026-11-18'), true);
  assert.equal(esFechaValida('2024-02-29'), true);
  assert.equal(esFechaValida('2026-02-29'), false);
  assert.equal(esFechaValida('2026-02-30'), false);
  assert.equal(esFechaValida('2026-13-01'), false);
  assert.equal(esFechaValida('18/11/2026'), false);
  assert.equal(esFechaValida(''), false);
});

test('AUT-18 sumarDias y diferenciaDias cruzan meses, años y bisiestos', () => {
  assert.equal(sumarDias('2026-11-18', -1), '2026-11-17');
  assert.equal(sumarDias('2026-11-18', 13), '2026-12-01');
  assert.equal(sumarDias('2026-01-01', -1), '2025-12-31');
  assert.equal(sumarDias('2024-02-28', 1), '2024-02-29');
  assert.equal(diferenciaDias('2026-11-10', '2026-11-18'), 8);
  assert.equal(diferenciaDias('2026-11-18', '2026-11-10'), -8);
  assert.equal(diferenciaDias('2026-11-18', '2026-11-18'), 0);
});

test('AUT-19 resolverFecha devuelve vacío cuando no se menciona fecha y respeta fechas ISO', () => {
  assert.deepEqual(fecha(null), { fecha: null, error: null });
  assert.deepEqual(fecha(''), { fecha: null, error: null });
  assert.deepEqual(fecha('   '), { fecha: null, error: null });
  assert.deepEqual(fecha(123), { fecha: null, error: null });
  assert.deepEqual(fecha('2026-11-10'), { fecha: '2026-11-10', error: null });
});

test('AUT-20 resolverFecha entiende hoy, ayer, anteayer y anoche', () => {
  assert.equal(fecha('hoy').fecha, '2026-11-18');
  assert.equal(fecha('esta mañana').fecha, '2026-11-18');
  assert.equal(fecha('ayer').fecha, '2026-11-17');
  assert.equal(fecha('anoche').fecha, '2026-11-17');
  assert.equal(fecha('anteayer').fecha, '2026-11-16');
  assert.equal(fecha('antier').fecha, '2026-11-16');
  assert.equal(fecha('antes de ayer').fecha, '2026-11-16');
});

test('AUT-21 resolverFecha rechaza las fechas futuras', () => {
  assert.deepEqual(fecha('mañana'), { fecha: null, error: 'futura' });
  assert.deepEqual(fecha('pasado mañana'), { fecha: null, error: 'futura' });
  assert.deepEqual(fecha('la próxima semana'), { fecha: null, error: 'futura' });
  assert.deepEqual(fecha('dentro de 3 días'), { fecha: null, error: 'futura' });
  assert.deepEqual(fecha('el lunes que viene'), { fecha: null, error: 'futura' });
  assert.deepEqual(fecha('la semana que viene'), { fecha: null, error: 'futura' });
  assert.deepEqual(fecha('2026-12-25'), { fecha: null, error: 'futura' });
});

test('AUT-22 resolverFecha entiende "hace N días" y "hace N semanas"', () => {
  assert.equal(fecha('hace 3 días').fecha, '2026-11-15');
  assert.equal(fecha('hace una semana').fecha, '2026-11-11');
  assert.equal(fecha('hace dos semanas').fecha, '2026-11-04');
});

test('AUT-23 resolverFecha entiende los días de la semana como el más reciente ya pasado', () => {
  assert.equal(fecha('el lunes').fecha, '2026-11-16');
  assert.equal(fecha('el viernes').fecha, '2026-11-13');
  assert.equal(fecha('el domingo').fecha, '2026-11-15');
  assert.equal(fecha('el viernes pasado').fecha, '2026-11-13');
  assert.equal(fecha('el miércoles').fecha, '2026-11-11');
});

test('AUT-24 resolverFecha entiende un día de la semana pasada', () => {
  assert.equal(fecha('el lunes de la semana pasada').fecha, '2026-11-09');
  assert.equal(fecha('el viernes de la semana pasada').fecha, '2026-11-13');
});

test('AUT-25 resolverFecha entiende día y mes escritos de distintas formas', () => {
  assert.equal(fecha('3 de noviembre').fecha, '2026-11-03');
  assert.equal(fecha('3 nov').fecha, '2026-11-03');
  assert.equal(fecha('el 3 de noviembre').fecha, '2026-11-03');
  assert.equal(fecha('25 de diciembre').fecha, '2025-12-25');
  assert.equal(fecha('20 de diciembre de 2025').fecha, '2025-12-20');
  assert.equal(fecha('15/11').fecha, '2026-11-15');
  assert.equal(fecha('15/11/2026').fecha, '2026-11-15');
  assert.equal(fecha('15-11-26').fecha, '2026-11-15');
});

test('AUT-26 resolverFecha entiende solo el día del mes y retrocede al mes anterior si hace falta', () => {
  assert.equal(fecha('el 15').fecha, '2026-11-15');
  assert.equal(fecha('el 25').fecha, '2026-10-25');
  assert.equal(fecha('el 31').fecha, '2026-10-31');
  assert.equal(fecha('18').fecha, '2026-11-18');
});

test('AUT-27 resolverFecha rechaza fechas inexistentes o ininteligibles', () => {
  assert.deepEqual(fecha('31 de febrero'), { fecha: null, error: 'invalida' });
  assert.deepEqual(fecha('30 de febrero'), { fecha: null, error: 'invalida' });
  assert.deepEqual(fecha('asdf'), { fecha: null, error: 'invalida' });
});

test('AUT-28 resolverFecha acepta hasta 365 días atrás y rechaza lo más antiguo', () => {
  assert.deepEqual(fecha('2025-11-18'), { fecha: '2025-11-18', error: null });
  assert.deepEqual(fecha('2025-11-17'), { fecha: null, error: 'antigua' });
  assert.deepEqual(fecha('2025-01-01'), { fecha: null, error: 'antigua' });
  assert.deepEqual(fecha('hace 500 días'), { fecha: null, error: 'antigua' });
});

test('AUT-29 describirFecha usa hoy, ayer y anteayer, y fecha corta para el resto', () => {
  assert.equal(describirFecha('2026-11-18', HOY), 'hoy');
  assert.equal(describirFecha('2026-11-17', HOY), 'ayer');
  assert.equal(describirFecha('2026-11-16', HOY), 'anteayer');
  assert.equal(describirFecha('2026-11-10', HOY), '10 nov');
  assert.equal(describirFecha('2025-12-24', HOY), '24 dic 2025');
});