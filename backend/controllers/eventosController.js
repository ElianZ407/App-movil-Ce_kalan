const pool = require('../config/database');

// GET /api/eventos
const obtenerMisEventos = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM eventos WHERE user_id = ? ORDER BY fecha ASC',
            [req.usuario.id]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error al obtener eventos:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener eventos.' });
    }
};

// GET /api/eventos/:id
const obtenerUno = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM eventos WHERE id = ? AND user_id = ?',
            [req.params.id, req.usuario.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, mensaje: 'Evento no encontrado.' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error al obtener evento:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener evento.' });
    }
};

// POST /api/eventos
const crear = async (req, res) => {
    const { titulo, descripcion, fecha, color } = req.body;
    const user_id = req.usuario.id;

    if (!titulo || !fecha) {
        return res.status(400).json({ success: false, mensaje: 'Título y fecha son requeridos.' });
    }

    // Validar formato de fecha (YYYY-MM-DD)
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
        return res.status(400).json({
            success: false,
            mensaje: 'Formato de fecha inválido. Use YYYY-MM-DD.'
        });
    }

    try {
        const [result] = await pool.execute(
            'INSERT INTO eventos (titulo, descripcion, fecha, color, user_id) VALUES (?, ?, ?, ?, ?)',
            [titulo, descripcion || null, fecha, color || '#2E7D32', user_id]
        );

        const [nuevo] = await pool.execute('SELECT * FROM eventos WHERE id = ?', [result.insertId]);
        res.status(201).json({ success: true, mensaje: 'Evento creado.', data: nuevo[0] });
    } catch (error) {
        console.error('Error al crear evento:', error);
        res.status(500).json({ success: false, mensaje: 'Error al crear evento.' });
    }
};

// PUT /api/eventos/:id
const actualizar = async (req, res) => {
    const { titulo, descripcion, fecha, color } = req.body;
    const { id } = req.params;

    try {
        const [existing] = await pool.execute(
            'SELECT * FROM eventos WHERE id = ? AND user_id = ?',
            [id, req.usuario.id]
        );
        if (existing.length === 0) {
            return res.status(404).json({ success: false, mensaje: 'Evento no encontrado.' });
        }

        await pool.execute(
            'UPDATE eventos SET titulo = ?, descripcion = ?, fecha = ?, color = ?, updated_at = NOW() WHERE id = ?',
            [
                titulo || existing[0].titulo,
                descripcion !== undefined ? descripcion : existing[0].descripcion,
                fecha || existing[0].fecha,
                color || existing[0].color,
                id
            ]
        );

        const [actualizado] = await pool.execute('SELECT * FROM eventos WHERE id = ?', [id]);
        res.json({ success: true, mensaje: 'Evento actualizado.', data: actualizado[0] });
    } catch (error) {
        console.error('Error al actualizar evento:', error);
        res.status(500).json({ success: false, mensaje: 'Error al actualizar evento.' });
    }
};

// DELETE /api/eventos/:id
const eliminar = async (req, res) => {
    try {
        const [existing] = await pool.execute(
            'SELECT * FROM eventos WHERE id = ? AND user_id = ?',
            [req.params.id, req.usuario.id]
        );
        if (existing.length === 0) {
            return res.status(404).json({ success: false, mensaje: 'Evento no encontrado.' });
        }

        await pool.execute('DELETE FROM eventos WHERE id = ?', [req.params.id]);
        res.json({ success: true, mensaje: 'Evento eliminado.' });
    } catch (error) {
        console.error('Error al eliminar evento:', error);
        res.status(500).json({ success: false, mensaje: 'Error al eliminar evento.' });
    }
};

module.exports = { obtenerMisEventos, obtenerUno, crear, actualizar, eliminar };
