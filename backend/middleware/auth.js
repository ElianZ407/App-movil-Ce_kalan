const jwt = require('jsonwebtoken');
require('dotenv').config();

const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            mensaje: 'Acceso denegado. Token no proporcionado.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                mensaje: 'Token expirado. Inicia sesión nuevamente.'
            });
        }
        return res.status(403).json({
            success: false,
            mensaje: 'Token inválido.'
        });
    }
};

const verificarAdmin = (req, res, next) => {
    if (req.usuario.tipo !== 'admin') {
        return res.status(403).json({
            success: false,
            mensaje: 'Acceso restringido. Se requieren permisos de administrador.'
        });
    }
    next();
};

module.exports = { verificarToken, verificarAdmin };
