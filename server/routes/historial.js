const express = require('express');
const requireAuth = require('../middleware/auth');
const historialService = require('../services/historialService');
const { manejarError } = require('../utils/errores');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const limite = req.query.limite ? Number(req.query.limite) : 20;
    const historial = await historialService.listarHistorial(req.user.id, limite);
    res.json({ historial });
  } catch (err) {
    manejarError(err, res);
  }
});

module.exports = router;