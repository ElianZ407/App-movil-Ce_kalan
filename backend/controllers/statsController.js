const pool = require('../config/database');

// GET /api/stats — Estadísticas globales del usuario autenticado
const obtenerStats = async (req, res) => {
    const userId = req.usuario.id;

    try {
        // Total plaguicidas (admin ve todos, usuario solo los propios)
        const esAdmin = req.usuario.tipo === 'admin';
        const [[{ total_plaguicidas }]] = await pool.execute(
            esAdmin
                ? 'SELECT COUNT(*) AS total_plaguicidas FROM plaguicidas'
                : 'SELECT COUNT(*) AS total_plaguicidas FROM plaguicidas WHERE user_id = ?',
            esAdmin ? [] : [userId]
        );

        // Total cálculos del usuario
        const [[{ total_calculos }]] = await pool.execute(
            'SELECT COUNT(*) AS total_calculos FROM calculos WHERE user_id = ?',
            [userId]
        );

        // Último cálculo
        const [ultimoCalculo] = await pool.execute(
            'SELECT ancho, largo, dosis, resultado, fecha FROM calculos WHERE user_id = ? ORDER BY fecha DESC LIMIT 1',
            [userId]
        );

        // Próximos 3 eventos (fechas iguales o posteriores a hoy)
        const hoy = new Date().toISOString().substring(0, 10);
        const [proximosEventos] = await pool.execute(
            `SELECT titulo, fecha, color FROM eventos
             WHERE user_id = ? AND fecha >= ?
             ORDER BY fecha ASC LIMIT 3`,
            [userId, hoy]
        );

        // Plaguicidas con stock bajo (< 5 L) – solo los que tienen stock definido
        const [stockBajo] = await pool.execute(
            `SELECT id, nombre, tipo, stock FROM plaguicidas
             WHERE stock IS NOT NULL AND stock < 5
             ORDER BY stock ASC`,
            []
        );

        res.json({
            success: true,
            data: {
                total_plaguicidas,
                total_calculos,
                ultimo_calculo: ultimoCalculo[0] || null,
                proximos_eventos: proximosEventos,
                stock_bajo: stockBajo,
            },
        });
    } catch (error) {
        console.error('Error al obtener stats:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener estadísticas.' });
    }
};

module.exports = { obtenerStats };
