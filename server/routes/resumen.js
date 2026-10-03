const express = require('express');
const requireAuth = require('../middleware/auth');
const resumenService = require('../services/resumenService');
const { manejarError } = require('../utils/errores');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const resumen = await resumenService.calcularResumen(req.user.id, req.query.mes);
    res.json({ resumen });
  } catch (err) {
    manejarError(err, res);
  }
});

module.exports = router;