const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const { obtenerMisEventos, obtenerUno, crear, actualizar, eliminar } = require('../controllers/eventosController');

// GET /api/eventos
router.get('/', verificarToken, obtenerMisEventos);

// GET /api/eventos/:id
router.get('/:id', verificarToken, obtenerUno);

// POST /api/eventos
router.post('/', verificarToken, crear);

// PUT /api/eventos/:id
router.put('/:id', verificarToken, actualizar);

// DELETE /api/eventos/:id
router.delete('/:id', verificarToken, eliminar);

module.exports = router;
