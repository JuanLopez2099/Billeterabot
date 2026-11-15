const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
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
} = require('../utils/conversacion');

const CUENTAS = [
  { id: '1', nombre: 'Nequi' },
  { id: '2', nombre: 'Bancolombia' },
  { id: '3', nombre: 'Banco de Bogotá' },
  { id: '4', nombre: 'Efectivo' },
];

test('AUT-01 limpiar quita tildes, signos y espacios de más', () => {
  assert.equal(limpiar('¡La de  Nequi, porfa!'), 'la de nequi porfa');
  assert.equal(limpiar('  Ñandú  '), 'nandu');
  assert.equal(limpiar(undefined), '');
});

test('AUT-02 extraerMonto entiende montos escritos con cifras', () => {
  assert.equal(extraerMonto('20000'), 20000);
  assert.equal(extraerMonto('20.000'), 20000);
  assert.equal(extraerMonto('15,000'), 15000);
  assert.equal(extraerMonto('$20.000'), 20000);
  assert.equal(extraerMonto('$ 20.000'), 20000);
  assert.equal(extraerMonto('20 mil'), 20000);
  assert.equal(extraerMonto('20k'), 20000);
  assert.equal(extraerMonto('15000 pesos'), 15000);
  assert.equal(extraerMonto('1.500.000'), 1500000);
});

test('AUT-03 extraerMonto entiende decimales y millones sin errores de redondeo', () => {
  assert.equal(extraerMonto('1,5 millones'), 1500000);
  assert.equal(extraerMonto('2 millones'), 2000000);
  assert.equal(extraerMonto('0,1 mil'), 100);
  assert.equal(extraerMonto('2,5 mil'), 2500);
  assert.ok(Number.isInteger(extraerMonto('1,5 millones')));
});

test('AUT-04 extraerMonto entiende montos escritos con palabras', () => {
  assert.equal(extraerMonto('veinte mil'), 20000);
  assert.equal(extraerMonto('quince mil'), 15000);
  assert.equal(extraerMonto('cien mil'), 100000);
  assert.equal(extraerMonto('mil'), 1000);
  assert.equal(extraerMonto('un millon'), 1000000);
  assert.equal(extraerMonto('dos millones'), 2000000);
  assert.equal(extraerMonto('treinta y cinco mil'), 35000);
  assert.equal(extraerMonto('ciento veinte mil'), 120000);
  assert.equal(extraerMonto('doscientos cincuenta mil'), 250000);
  assert.equal(extraerMonto('dos millones quinientos mil'), 2500000);
  assert.equal(extraerMonto('veinticinco mil pesos'), 25000);
});

test('AUT-05 extraerMonto rechaza textos que no son un monto', () => {
  assert.equal(extraerMonto('hola'), null);
  assert.equal(extraerMonto('nequi'), null);
  assert.equal(extraerMonto('gasté 5000'), null);
  assert.equal(extraerMonto('0'), null);
  assert.equal(extraerMonto('cero'), null);
  assert.equal(extraerMonto(''), null);
});

test('AUT-06 contieneMonto distingue una respuesta de un movimiento nuevo', () => {
  assert.equal(contieneMonto('nequi'), false);
  assert.equal(contieneMonto('gasté 5000 con nequi'), true);
  assert.equal(contieneMonto('pagué veinte mil'), true);
});

test('AUT-07 elegirOpcion encuentra la cuenta aunque venga con relleno', () => {
  assert.equal(elegirOpcion('nequi', CUENTAS).id, '1');
  assert.equal(elegirOpcion('NEQUI', CUENTAS).id, '1');
  assert.equal(elegirOpcion('la de nequi', CUENTAS).id, '1');
  assert.equal(elegirOpcion('con bancolombia porfa', CUENTAS).id, '2');
  assert.equal(elegirOpcion('banco de bogota', CUENTAS).id, '3');
});

test('AUT-08 elegirOpcion acepta el comienzo de un nombre o una palabra del nombre si es única', () => {
  assert.equal(elegirOpcion('bancol', CUENTAS).id, '2');
  assert.equal(elegirOpcion('efec', CUENTAS).id, '4');
  assert.equal(elegirOpcion('bogota', CUENTAS).id, '3');
});

test('AUT-09 elegirOpcion no adivina cuando hay ambigüedad o no hay coincidencia', () => {
  assert.equal(elegirOpcion('nequi y bancolombia', CUENTAS), null);
  assert.equal(elegirOpcion('la alcancia', CUENTAS), null);
  assert.equal(elegirOpcion('', CUENTAS), null);
  assert.equal(elegirOpcion('nequi', []), null);
});

test('AUT-10 elegirOpcion no adivina cuando una palabra corresponde a varias cuentas', () => {
  assert.equal(elegirOpcion('banco', CUENTAS), null);
});

test('AUT-11 elegirOpcion desempata nombres anidados con el más específico', () => {
  const opciones = [
    { id: 'a', nombre: 'Banco' },
    { id: 'b', nombre: 'Banco de Bogotá' },
  ];
  assert.equal(elegirOpcion('el banco de bogota', opciones).id, 'b');
});

test('AUT-12 coincideNombreExacto reconoce cuentas con números en el nombre', () => {
  const opciones = [{ id: '1', nombre: 'Ahorros 2026' }];
  assert.equal(coincideNombreExacto('ahorros 2026', opciones), true);
  assert.equal(coincideNombreExacto('Ahorros 2026', opciones), true);
  assert.equal(coincideNombreExacto('ahorros', opciones), false);
  assert.equal(coincideNombreExacto('', opciones), false);
  assert.equal(coincideNombreExacto('ahorros 2026', undefined), false);
});

test('AUT-13 esSinCategoria y esCancelacion reconocen las frases habituales', () => {
  assert.equal(esSinCategoria('Sin categoría'), true);
  assert.equal(esSinCategoria('ninguna'), true);
  assert.equal(esSinCategoria('comida'), false);
  assert.equal(esCancelacion('cancela'), true);
  assert.equal(esCancelacion('Olvídalo'), true);
  assert.equal(esCancelacion('mejor no'), true);
  assert.equal(esCancelacion('cancelar todo'), true);
  assert.equal(esCancelacion('nequi'), false);
});

test('AUT-14 esAfirmacion y esNegacion entienden sí y no escritos de forma natural', () => {
  for (const texto of ['sí', 'si', 'Sí, créala', 'dale', 'claro', 'ok', 'créala']) {
    assert.equal(esAfirmacion(texto), true, texto);
  }
  for (const texto of ['sin', 'no', 'simon', 'nequi']) {
    assert.equal(esAfirmacion(texto), false, texto);
  }
  for (const texto of ['no', 'nop', 'mejor no', 'no, gracias']) {
    assert.equal(esNegacion(texto), true, texto);
  }
  for (const texto of ['nota', 'nunca', 'si', 'nequi']) {
    assert.equal(esNegacion(texto), false, texto);
  }
});

test('AUT-15 capitalizar deja el nombre listo para guardarse', () => {
  assert.equal(capitalizar('alcancía'), 'Alcancía');
  assert.equal(capitalizar('  mi   ahorro '), 'Mi ahorro');
  assert.equal(capitalizar(''), '');
  assert.equal(capitalizar(null), '');
  assert.equal(capitalizar(undefined), '');
});

test('AUT-16 elegirColor no repite un color en uso mientras haya colores libres', () => {
  const usado = '#1f5c3f';
  for (let i = 0; i < 100; i += 1) {
    const color = elegirColor([usado]);
    assert.match(color, /^#[0-9a-f]{6}$/i);
    assert.notEqual(color, usado);
  }
  assert.match(elegirColor([]), /^#[0-9a-f]{6}$/i);
});