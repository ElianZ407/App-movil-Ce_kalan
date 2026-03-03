const pool = require('../config/database');

// GET /api/calculos - Obtener cálculos del usuario actual
const obtenerMisCalculos = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT c.*, p.nombre as pesticida_nombre, p.tipo as pesticida_tipo, p.unidad
             FROM calculos c
             LEFT JOIN plaguicidas p ON c.plaguicida_id = p.id
             WHERE c.user_id = ?
             ORDER BY c.fecha DESC`,
            [req.usuario.id]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error al obtener cálculos:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener cálculos.' });
    }
};

// POST /api/calculos - Guardar un nuevo cálculo
const crear = async (req, res) => {
    const { ancho, largo, dosis, notas, plaguicida_id } = req.body;
    const user_id = req.usuario.id;

    if (ancho === undefined || largo === undefined || dosis === undefined || !plaguicida_id) {
        return res.status(400).json({
            success: false,
            mensaje: 'Ancho, largo, dosis y plaguicida_id son requeridos.'
        });
    }

    try {
        // Obtener el pesticida para tomar sus unidades
        const [pesticidas] = await pool.execute(
            'SELECT * FROM plaguicidas WHERE id = ?',
            [plaguicida_id]
        );

        if (pesticidas.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Plaguicida no encontrado.'
            });
        }

        const pesticida = pesticidas[0];
        const unidad = pesticida.unidad; // Unidad tomada del pesticida registrado

        // Cálculo: resultado = (ancho * largo) * dosis / 10000
        // (Conversión de hectáreas a m²: 1 ha = 10,000 m²)
        const area = parseFloat(ancho) * parseFloat(largo);
        const resultado = (area * parseFloat(dosis)) / 10000;

        const [result] = await pool.execute(
            `INSERT INTO calculos (ancho, largo, dosis, resultado, notas, user_id, plaguicida_id, unidad)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [ancho, largo, dosis, resultado, notas || null, user_id, plaguicida_id, unidad]
        );

        const [nuevo] = await pool.execute(
            `SELECT c.*, p.nombre as pesticida_nombre, p.tipo as pesticida_tipo, p.unidad
             FROM calculos c
             LEFT JOIN plaguicidas p ON c.plaguicida_id = p.id
             WHERE c.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            mensaje: 'Cálculo guardado exitosamente.',
            data: nuevo[0]
        });
    } catch (error) {
        console.error('Error al guardar cálculo:', error);
        res.status(500).json({ success: false, mensaje: 'Error al guardar cálculo.' });
    }
};

// DELETE /api/calculos/:id
const eliminar = async (req, res) => {
    try {
        const [existing] = await pool.execute(
            'SELECT * FROM calculos WHERE id = ? AND user_id = ?',
            [req.params.id, req.usuario.id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, mensaje: 'Cálculo no encontrado.' });
        }

        await pool.execute('DELETE FROM calculos WHERE id = ?', [req.params.id]);
        res.json({ success: true, mensaje: 'Cálculo eliminado.' });
    } catch (error) {
        console.error('Error al eliminar cálculo:', error);
        res.status(500).json({ success: false, mensaje: 'Error al eliminar cálculo.' });
    }
};

module.exports = { obtenerMisCalculos, crear, eliminar };