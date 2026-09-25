const express = require('express');
const requireAuth = require('../middleware/auth');
const cuentaService = require('../services/cuentaService');
const { manejarError } = require('../utils/errores');

const router = express.Router();

router.use(requireAuth);


router.get('/', async (req, res) => {
  try {
    const cuentas = await cuentaService.listarCuentas();
    res.json({ cuentas });
  } catch (err) {
    manejarError(err, res);
  }
});

module.exports = router;