const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
// dotenv ya fue cargado en server.js al iniciar


const SALT_ROUNDS = 10;

// POST /api/auth/registro
const registro = async (req, res) => {
    const { nombre, correo, password, tipo = 'usuario' } = req.body;

    if (!nombre || !correo || !password) {
        return res.status(400).json({
            success: false,
            mensaje: 'Nombre, correo y contraseña son requeridos.'
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            mensaje: 'La contraseña debe tener al menos 6 caracteres.'
        });
    }

    try {
        // Verificar si el correo ya existe
        const [existing] = await pool.execute(
            'SELECT id FROM usuarios WHERE correo = ?',
            [correo]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                mensaje: 'El correo ya está registrado.'
            });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Solo permitir 'admin' o 'usuario'
        const tipoFinal = tipo === 'admin' ? 'admin' : 'usuario';

        // Insertar usuario
        const [result] = await pool.execute(
            'INSERT INTO usuarios (nombre, correo, password, tipo) VALUES (?, ?, ?, ?)',
            [nombre, correo, hashedPassword, tipoFinal]
        );

        // Generar token
        const token = jwt.sign(
            { id: result.insertId, nombre, correo, tipo: tipoFinal },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(201).json({
            success: true,
            mensaje: 'Usuario registrado exitosamente.',
            token,
            usuario: { id: result.insertId, nombre, correo, tipo: tipoFinal }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error interno del servidor.'
        });
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    const { correo, password } = req.body;

    if (!correo || !password) {
        return res.status(400).json({
            success: false,
            mensaje: 'Correo y contraseña son requeridos.'
        });
    }

    try {
        const [usuarios] = await pool.execute(
            'SELECT id, nombre, correo, password, tipo FROM usuarios WHERE correo = ?',
            [correo]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                success: false,
                mensaje: 'Credenciales incorrectas.'
            });
        }

        const usuario = usuarios[0];
        const passwordValido = await bcrypt.compare(password, usuario.password);

        if (!passwordValido) {
            return res.status(401).json({
                success: false,
                mensaje: 'Credenciales incorrectas.'
            });
        }

        const token = jwt.sign(
            { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, tipo: usuario.tipo },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            mensaje: 'Login exitoso.',
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                tipo: usuario.tipo
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error interno del servidor.'
        });
    }
};

// GET /api/auth/perfil
const perfil = async (req, res) => {
    try {
        const [usuarios] = await pool.execute(
            'SELECT id, nombre, correo, tipo, created_at FROM usuarios WHERE id = ?',
            [req.usuario.id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ success: false, mensaje: 'Usuario no encontrado.' });
        }

        res.json({ success: true, usuario: usuarios[0] });
    } catch (error) {
        console.error('Error en perfil:', error);
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor.' });
    }
};

module.exports = { registro, login, perfil };
