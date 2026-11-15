const { test } = require('node:test');
const assert = require('node:assert/strict');
const { errorValidacion, manejarError } = require('../utils/errores');

function respuestaFalsa() {
  const res = { codigo: null, cuerpo: null };
  res.status = (codigo) => {
    res.codigo = codigo;
    return res;
  };
  res.json = (cuerpo) => {
    res.cuerpo = cuerpo;
    return res;
  };
  return res;
}

test('AUT-50 errorValidacion crea un error con estado 400 y su mensaje', () => {
  const error = errorValidacion('El monto debe ser mayor a 0');
  assert.ok(error instanceof Error);
  assert.equal(error.status, 400);
  assert.equal(error.message, 'El monto debe ser mayor a 0');
});

test('AUT-51 manejarError responde con el estado y el mensaje de un error de validación', () => {
  const res = respuestaFalsa();
  manejarError(errorValidacion('Nombre obligatorio'), res);
  assert.equal(res.codigo, 400);
  assert.deepEqual(res.cuerpo, { error: 'Nombre obligatorio' });
});

test('AUT-52 manejarError responde 500 genérico sin exponer detalles internos', (t) => {
  t.mock.method(console, 'error', () => {});
  const res = respuestaFalsa();
  manejarError(new Error('password=secreto en la conexión a la base de datos'), res);
  assert.equal(res.codigo, 500);
  assert.deepEqual(res.cuerpo, { error: 'error interno intenta de nuevo' });
  assert.doesNotMatch(JSON.stringify(res.cuerpo), /secreto/);
});