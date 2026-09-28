const express = require('express');
const requireAuth = require('../middleware/auth');
const categoriaService = require('../services/categoriaService');
const { manejarError } = require('../utils/errores');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const categorias = await categoriaService.listarCategorias(req.user.id);
    res.json({ categorias });
  } catch (err) {
    manejarError(err, res);
  }
});

router.post('/', async (req, res) => {
  try {
    const categoria = await categoriaService.crearCategoria(req.user.id, req.body || {});
    res.status(201).json({ categoria });
  } catch (err) {
    manejarError(err, res);
  }
});

router.put('/:id', async (req, res) => {
  try {
    const categoria = await categoriaService.editarCategoria(req.user.id, req.params.id, req.body || {});
    res.json({ categoria });
  } catch (err) {
    manejarError(err, res);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await categoriaService.eliminarCategoria(req.user.id, req.params.id);
    res.status(204).send();
  } catch (err) {
    manejarError(err, res);
  }
});

module.exports = router;