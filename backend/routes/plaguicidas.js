const express = require('express');
const router = express.Router();
const { verificarToken, verificarAdmin } = require('../middleware/auth');
const { obtenerTodos, obtenerUno, crear, actualizar, eliminar, actualizarStock } = require('../controllers/plaguicidasController');
const upload = require('../config/multer');

// GET /api/plaguicidas - Todos pueden ver
router.get('/', verificarToken, obtenerTodos);

// GET /api/plaguicidas/:id
router.get('/:id', verificarToken, obtenerUno);

// POST /api/plaguicidas - Solo admin puede crear
router.post('/', verificarToken, verificarAdmin, upload.single('imagen'), crear);

// PUT /api/plaguicidas/:id - Solo admin puede editar
router.put('/:id', verificarToken, verificarAdmin, upload.single('imagen'), actualizar);

// DELETE /api/plaguicidas/:id - Solo admin puede eliminar
router.delete('/:id', verificarToken, verificarAdmin, eliminar);

// PATCH /api/plaguicidas/:id/stock - Admin actualiza el stock
router.patch('/:id/stock', verificarToken, verificarAdmin, actualizarStock);

module.exports = router;
