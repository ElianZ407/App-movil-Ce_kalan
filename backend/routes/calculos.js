const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const { obtenerMisCalculos, crear, eliminar } = require('../controllers/calculosController');

// GET /api/calculos
router.get('/', verificarToken, obtenerMisCalculos);

// POST /api/calculos
router.post('/', verificarToken, crear);

// DELETE /api/calculos/:id
router.delete('/:id', verificarToken, eliminar);

module.exports = router;
