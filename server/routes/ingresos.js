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