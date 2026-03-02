const pool = require('../config/database');

// GET /api/plaguicidas
const obtenerTodos = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT p.*, u.nombre as usuario_nombre 
       FROM plaguicidas p 
       JOIN usuarios u ON p.user_id = u.id 
       ORDER BY p.created_at DESC`
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error al obtener plaguicidas:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener plaguicidas.' });
    }
};

// GET /api/plaguicidas/:id
const obtenerUno = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM plaguicidas WHERE id = ?',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, mensaje: 'Plaguicida no encontrado.' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error al obtener plaguicida:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener plaguicida.' });
    }
};

// POST /api/plaguicidas
const crear = async (req, res) => {
    const { nombre, tipo } = req.body;
    const user_id = req.usuario.id;

    if (!nombre || !tipo) {
        return res.status(400).json({ success: false, mensaje: 'Nombre y tipo son requeridos.' });
    }

    // Si se subió una imagen, obtener su URL
    let imagen_url = null;
    if (req.file) {
        imagen_url = `/uploads/${req.file.filename}`;
    }

    try {
        const [result] = await pool.execute(
            'INSERT INTO plaguicidas (nombre, tipo, imagen_url, user_id) VALUES (?, ?, ?, ?)',
            [nombre, tipo, imagen_url, user_id]
        );

        const [nuevo] = await pool.execute('SELECT * FROM plaguicidas WHERE id = ?', [result.insertId]);
        res.status(201).json({ success: true, mensaje: 'Plaguicida creado.', data: nuevo[0] });
    } catch (error) {
        console.error('Error al crear plaguicida:', error);
        res.status(500).json({ success: false, mensaje: 'Error al crear plaguicida.' });
    }
};

// PUT /api/plaguicidas/:id
const actualizar = async (req, res) => {
    const { nombre, tipo } = req.body;
    const { id } = req.params;

    try {
        // Verificar que existe
        const [existing] = await pool.execute('SELECT * FROM plaguicidas WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, mensaje: 'Plaguicida no encontrado.' });
        }

        let imagen_url = existing[0].imagen_url;
        if (req.file) {
            imagen_url = `/uploads/${req.file.filename}`;
        }

        await pool.execute(
            'UPDATE plaguicidas SET nombre = ?, tipo = ?, imagen_url = ?, updated_at = NOW() WHERE id = ?',
            [nombre || existing[0].nombre, tipo || existing[0].tipo, imagen_url, id]
        );

        const [actualizado] = await pool.execute('SELECT * FROM plaguicidas WHERE id = ?', [id]);
        res.json({ success: true, mensaje: 'Plaguicida actualizado.', data: actualizado[0] });
    } catch (error) {
        console.error('Error al actualizar plaguicida:', error);
        res.status(500).json({ success: false, mensaje: 'Error al actualizar plaguicida.' });
    }
};

// DELETE /api/plaguicidas/:id
const eliminar = async (req, res) => {
    try {
        const [existing] = await pool.execute('SELECT * FROM plaguicidas WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, mensaje: 'Plaguicida no encontrado.' });
        }

        await pool.execute('DELETE FROM plaguicidas WHERE id = ?', [req.params.id]);
        res.json({ success: true, mensaje: 'Plaguicida eliminado correctamente.' });
    } catch (error) {
        console.error('Error al eliminar plaguicida:', error);
        res.status(500).json({ success: false, mensaje: 'Error al eliminar plaguicida.' });
    }
};

module.exports = { obtenerTodos, obtenerUno, crear, actualizar, eliminar };
