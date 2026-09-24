const express = require('express');
const requireAuth = require('../middleware/auth');
const ingresoService = require('../services/ingresoService');
const { manejarError } = require('../utils/errores');

const router = express.Router();

router.use(requireAuth);

router.post('/', async (req, res) => {
  try {
    const ingreso = await ingresoService.crearIngreso(req.user.id, req.body || {});
    res.status(201).json({ ingreso });
  } catch (err) {
    manejarError(err, res);
  }
});

router.get('/', async (req, res) => {
  try {
    const orden = req.query.orden === 'asc' ? 'asc' : 'desc';
    const ingresos = await ingresoService.listarIngresos(req.user.id, orden);
    res.json({ ingresos });
  } catch (err) {
    manejarError(err, res);
  }
});

module.exports = router;