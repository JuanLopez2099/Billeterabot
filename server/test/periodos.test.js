const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolverPeriodo } = require('../utils/periodos');

const HOY = '2026-11-18';

function periodo(expresion, hoy = HOY) {
  const { desde, hasta, etiqueta, error } = resolverPeriodo(expresion, hoy);
  return { desde, hasta, etiqueta, error };
}

test('AUT-30 resolverPeriodo usa el mes actual cuando no se dice periodo', () => {
  const esperado = { desde: '2026-11-01', hasta: '2026-11-18', etiqueta: 'este mes', error: null };
  assert.deepEqual(periodo(null), esperado);
  assert.deepEqual(periodo(''), esperado);
  assert.deepEqual(periodo('este mes'), esperado);
});

test('AUT-31 resolverPeriodo entiende hoy, ayer y anteayer', () => {
  assert.deepEqual(periodo('hoy'), { desde: '2026-11-18', hasta: '2026-11-18', etiqueta: 'hoy', error: null });
  assert.deepEqual(periodo('ayer'), { desde: '2026-11-17', hasta: '2026-11-17', etiqueta: 'ayer', error: null });
  assert.deepEqual(periodo('anteayer'), { desde: '2026-11-16', hasta: '2026-11-16', etiqueta: 'anteayer', error: null });
});

test('AUT-32 resolverPeriodo calcula la semana de lunes a domingo', () => {
  assert.deepEqual(periodo('esta semana'), {
    desde: '2026-11-16', hasta: '2026-11-18', etiqueta: 'esta semana', error: null,
  });
  assert.deepEqual(periodo('la semana pasada'), {
    desde: '2026-11-09', hasta: '2026-11-15', etiqueta: 'la semana pasada', error: null,
  });
});

test('AUT-33 resolverPeriodo calcula el mes pasado, incluso cuando cruza de año', () => {
  assert.deepEqual(periodo('el mes pasado'), {
    desde: '2026-10-01', hasta: '2026-10-31', etiqueta: 'el mes pasado', error: null,
  });
  assert.deepEqual(periodo('lo gastado del mes pasado'), {
    desde: '2026-10-01', hasta: '2026-10-31', etiqueta: 'el mes pasado', error: null,
  });
  assert.deepEqual(periodo('el mes pasado', '2026-01-10'), {
    desde: '2025-12-01', hasta: '2025-12-31', etiqueta: 'el mes pasado', error: null,
  });
});

test('AUT-34 resolverPeriodo entiende este año y el año pasado', () => {
  assert.deepEqual(periodo('este año'), {
    desde: '2026-01-01', hasta: '2026-11-18', etiqueta: 'este año', error: null,
  });
  assert.deepEqual(periodo('el año pasado'), {
    desde: '2025-01-01', hasta: '2025-12-31', etiqueta: 'el año pasado', error: null,
  });
});

test('AUT-35 resolverPeriodo entiende los últimos N días, semanas y meses', () => {
  assert.deepEqual(periodo('los últimos 7 días'), {
    desde: '2026-11-12', hasta: '2026-11-18', etiqueta: 'en los últimos 7 días', error: null,
  });
  assert.deepEqual(periodo('la última semana'), {
    desde: '2026-11-12', hasta: '2026-11-18', etiqueta: 'en los últimos 7 días', error: null,
  });
  assert.deepEqual(periodo('últimos tres meses'), {
    desde: '2026-08-21', hasta: '2026-11-18', etiqueta: 'en los últimos 90 días', error: null,
  });
  assert.equal(periodo('últimos 400 días').error, 'invalido');
});

test('AUT-36 resolverPeriodo entiende los meses por nombre', () => {
  assert.deepEqual(periodo('octubre'), {
    desde: '2026-10-01', hasta: '2026-10-31', etiqueta: 'en octubre', error: null,
  });
  assert.deepEqual(periodo('en diciembre'), {
    desde: '2025-12-01', hasta: '2025-12-31', etiqueta: 'en diciembre de 2025', error: null,
  });
  assert.deepEqual(periodo('noviembre'), {
    desde: '2026-11-01', hasta: '2026-11-18', etiqueta: 'en noviembre', error: null,
  });
  assert.deepEqual(periodo('enero 2025'), {
    desde: '2025-01-01', hasta: '2025-01-31', etiqueta: 'en enero de 2025', error: null,
  });
});

test('AUT-37 resolverPeriodo avisa cuando no entiende el periodo', () => {
  assert.equal(periodo('la quincena rara').error, 'invalido');
  assert.equal(periodo('banana').error, 'invalido');
  assert.deepEqual(periodo('banana'), { desde: null, hasta: null, etiqueta: null, error: 'invalido' });
});