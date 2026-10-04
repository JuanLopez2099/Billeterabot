const express = require('express');
const requireAuth = require('../middleware/auth');
const telegramService = require('../services/telegramService');
const { obtenerUsernameDelBot } = require('../bot/bot');
const { manejarError } = require('../utils/errores');

const router = express.Router();

router.use(requireAuth);


router.post('/vinculacion', async (req, res) => {
  try {
    const username = obtenerUsernameDelBot();
    if (!username) {
      return res.status(503).json({ error: 'El bot de Telegram no está disponible por ahora' });
    }
    const { codigo, expiraEn } = await telegramService.generarCodigo(req.user.id);
    res.status(201).json({ codigo, expiraEn, enlace: `https://t.me/${username}?start=${codigo}` });
  } catch (err) {
    manejarError(err, res);
  }
});


router.get('/estado', async (req, res) => {
  try {
    const { vinculado } = await telegramService.estadoVinculacion(req.user.id);
    res.json({ vinculado, botDisponible: Boolean(obtenerUsernameDelBot()) });
  } catch (err) {
    manejarError(err, res);
  }
});

router.delete('/vinculacion', async (req, res) => {
  try {
    await telegramService.desvincular(req.user.id);
    res.status(204).send();
  } catch (err) {
    manejarError(err, res);
  }
});

module.exports = router;