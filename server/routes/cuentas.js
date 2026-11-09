const express = require('express');
const requireAuth = require('../middleware/auth');
const cuentaService = require('../services/cuentaService');
const { manejarError } = require('../utils/errores');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const cuentas = await cuentaService.listarCuentas(req.user.id);
    res.json({ cuentas });
  } catch (err) {
    manejarError(err, res);
  }
});

router.post('/', async (req, res) => {
  try {
    const cuenta = await cuentaService.crearCuenta(req.user.id, req.body || {});
    res.status(201).json({ cuenta });
  } catch (err) {
    manejarError(err, res);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await cuentaService.eliminarCuenta(req.user.id, req.params.id);
    res.status(204).send();
  } catch (err) {
    manejarError(err, res);
  }
});

module.exports = router;