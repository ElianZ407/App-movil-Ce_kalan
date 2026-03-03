const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const { obtenerStats } = require('../controllers/statsController');

// GET /api/stats
router.get('/', verificarToken, obtenerStats);

module.exports = router;
