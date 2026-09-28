const express = require('express');
const requireAuth = require('../middleware/auth');
const gastoService = require('../services/gastoService');
const { manejarError } = require('../utils/errores');

const router = express.Router();

router.use(requireAuth);

router.post('/', async (req, res) => {
  try {
    const gasto = await gastoService.crearGasto(req.user.id, req.body || {});
    res.status(201).json({ gasto });
  } catch (err) {
    manejarError(err, res);
  }
});

router.get('/', async (req, res) => {
  try {
    const orden = req.query.orden === 'asc' ? 'asc' : 'desc';
    const gastos = await gastoService.listarGastos(req.user.id, orden);
    res.json({ gastos });
  } catch (err) {
    manejarError(err, res);
  }
});

router.put('/:id', async (req, res) => {
  try {
    const gasto = await gastoService.editarGasto(req.user.id, req.params.id, req.body || {});
    res.json({ gasto });
  } catch (err) {
    manejarError(err, res);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await gastoService.eliminarGasto(req.user.id, req.params.id);
    res.status(204).send();
  } catch (err) {
    manejarError(err, res);
  }
});

module.exports = router;