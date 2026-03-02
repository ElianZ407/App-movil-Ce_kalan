const express = require('express');
const router = express.Router();
const { registro, login, perfil } = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');

// POST /api/auth/registro
router.post('/registro', registro);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/perfil (protegida)
router.get('/perfil', verificarToken, perfil);

module.exports = router;
