const { test } = require('node:test');
const assert = require('node:assert/strict');
const mensajes = require('../bot/mensajes');
const { fechaDeHoy } = require('../utils/fechas');

function plano(texto) {
  return texto.replace(/\s/g, ' ');
}

test('AUT-38 formatoPesos muestra pesos colombianos con separador de miles y sin decimales', () => {
  assert.equal(plano(mensajes.formatoPesos(15000)), '$ 15.000');
  assert.equal(plano(mensajes.formatoPesos(1500000)), '$ 1.500.000');
  assert.equal(plano(mensajes.formatoPesos(0)), '$ 0');
  assert.equal(plano(mensajes.formatoPesos(-500)), '-$ 500');
});

test('AUT-39 formatoPesos redondea y nunca muestra decimales', () => {
  assert.equal(plano(mensajes.formatoPesos(1234.56)), '$ 1.235');
  assert.equal(plano(mensajes.formatoPesos(99.4)), '$ 99');
  assert.doesNotMatch(mensajes.formatoPesos(1234.56), /,/);
});

test('AUT-40 escapar protege los caracteres especiales de HTML', () => {
  assert.equal(mensajes.escapar('<b>hola</b> & chao'), '&lt;b&gt;hola&lt;/b&gt; &amp; chao');
  assert.equal(mensajes.escapar(null), '');
  assert.equal(mensajes.escapar(undefined), '');
  assert.equal(mensajes.escapar(15), '15');
});

test('AUT-41 movimientoRegistrado describe un gasto con categoría, cuenta y descripción', () => {
  const texto = plano(mensajes.movimientoRegistrado({
    tipo: 'gasto',
    monto: 15000,
    categoria: 'Alimentación',
    cuenta: 'Nequi',
    descripcion: 'cena',
    fecha: fechaDeHoy(),
  }));
  assert.match(texto, /^✅ Gasto registrado: -\$ 15\.000 en <b>Alimentación<\/b> desde <b>Nequi<\/b> \(cena\)\.$/);
});

test('AUT-42 movimientoRegistrado describe un ingreso y una transferencia', () => {
  const ingreso = plano(mensajes.movimientoRegistrado({
    tipo: 'ingreso', monto: 500000, cuenta: 'Bancolombia', descripcion: 'salario', fecha: fechaDeHoy(),
  }));
  assert.match(ingreso, /^✅ Ingreso registrado: \+\$ 500\.000 en <b>Bancolombia<\/b> \(salario\)\.$/);

  const transferencia = plano(mensajes.movimientoRegistrado({
    tipo: 'transferencia', monto: 50000, cuentaOrigen: 'Nequi', cuentaDestino: 'Bancolombia', fecha: fechaDeHoy(),
  }));
  assert.match(transferencia, /^✅ Transferencia registrada: \$ 50\.000 de <b>Nequi<\/b> a <b>Bancolombia<\/b>\.$/);
});

test('AUT-43 movimientoRegistrado usa "actualizado" cuando se trata de una corrección', () => {
  const texto = mensajes.movimientoRegistrado({
    tipo: 'gasto', monto: 12000, cuenta: 'Nequi', fecha: fechaDeHoy(),
  }, true);
  assert.match(texto, /^✏️ Gasto actualizado/);
  assert.doesNotMatch(texto, /registrado/);
});

test('AUT-44 movimientoRegistrado muestra la fecha solo cuando no es de hoy', () => {
  const deHoy = mensajes.movimientoRegistrado({ tipo: 'gasto', monto: 1000, cuenta: 'Nequi', fecha: fechaDeHoy() });
  const antigua = mensajes.movimientoRegistrado({ tipo: 'gasto', monto: 1000, cuenta: 'Nequi', fecha: '2020-01-05' });
  assert.doesNotMatch(deHoy, /📅/);
  assert.match(antigua, /📅 5 ene 2020/);
});

test('AUT-45 movimientoRegistrado escapa el HTML que escribe el usuario', () => {
  const texto = mensajes.movimientoRegistrado({
    tipo: 'gasto', monto: 1000, cuenta: 'Nequi', descripcion: '<script>x</script>', fecha: fechaDeHoy(),
  });
  assert.doesNotMatch(texto, /<script>/);
  assert.match(texto, /&lt;script&gt;/);
});

test('AUT-46 movimientoDeshecho describe qué se deshizo', () => {
  assert.match(plano(mensajes.movimientoDeshecho({ tipo: 'gasto', monto: 12000, descripcion: 'cena' })), /deshice el gasto de \$ 12\.000 \(cena\)/);
  assert.match(plano(mensajes.movimientoDeshecho({ tipo: 'ingreso', monto: 500000 })), /deshice el ingreso de \$ 500\.000/);
  assert.match(
    plano(mensajes.movimientoDeshecho({ tipo: 'transferencia', monto: 50000, cuentaNombre: 'Nequi', cuentaDestinoNombre: 'Bancolombia' })),
    /deshice la transferencia de \$ 50\.000 de <b>Nequi<\/b> a <b>Bancolombia<\/b>/,
  );
});

test('AUT-47 saludo usa solo el primer nombre y escapa el HTML', () => {
  for (let i = 0; i < 20; i += 1) {
    const texto = mensajes.saludo('Juan Camilo López');
    assert.match(texto, /Juan/);
    assert.doesNotMatch(texto, /Camilo/);
  }
  assert.match(mensajes.saludo('<b>'), /&lt;b&gt;/);
  assert.doesNotMatch(mensajes.saludo(''), /, !/);
});

test('AUT-48 fechaNoValida distingue una fecha futura, antigua o ininteligible', () => {
  assert.match(mensajes.fechaNoValida('futura'), /todavía no llega/);
  assert.match(mensajes.fechaNoValida('antigua'), /más de un año/);
  assert.match(mensajes.fechaNoValida('invalida'), /No entendí la fecha/);
});

test('AUT-49 los mensajes de creación de cuentas y categorías usan el género correcto', () => {
  assert.match(mensajes.proponerCrear('cuenta', 'Alcancía'), /una cuenta llamada <b>Alcancía<\/b>/);
  assert.match(mensajes.proponerCrear('categoría', 'Mascotas'), /una categoría llamada <b>Mascotas<\/b>/);
  assert.match(mensajes.entidadCreada('cuenta', 'Binance'), /^✅ Cuenta «Binance» creada\.$/);
  assert.match(mensajes.entidadCreada('categoría', 'Mascotas'), /^✅ Categoría «Mascotas» creada\.$/);
  assert.match(mensajes.yaExiste('cuenta', 'Nequi'), /Ya tienes una cuenta llamada <b>Nequi<\/b>/);
});