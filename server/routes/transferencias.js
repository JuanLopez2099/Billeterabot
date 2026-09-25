const express = require('express');
const requireAuth = require('../middleware/auth');
const transferenciaService = require('../services/transferenciaService');
const { manejarError } = require('../utils/errores');

const router = express.Router();

router.use(requireAuth);


router.post('/', async (req, res) => {
  try {
    const transferencia = await transferenciaService.crearTransferencia(req.user.id, req.body || {});
    res.status(201).json({ transferencia });
  } catch (err) {
    manejarError(err, res);
  }
});


router.get('/', async (req, res) => {
  try {
    const orden = req.query.orden === 'asc' ? 'asc' : 'desc';
    const transferencias = await transferenciaService.listarTransferencias(req.user.id, orden);
    res.json({ transferencias });
  } catch (err) {
    manejarError(err, res);
  }
});

module.exports = router;