const pool = require('../config/database');
const { cifrar, descifrar } = require('../config/encryption');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Descifra todos los campos sensibles de una fila de cálculo
 * y convierte los numéricos de vuelta a Number.
 */
function descifrarFila(fila) {
    return {
        ...fila,
        ancho: parseFloat(descifrar(fila.ancho)),
        largo: parseFloat(descifrar(fila.largo)),
        dosis: parseFloat(descifrar(fila.dosis)),
        resultado: parseFloat(descifrar(fila.resultado)),
        notas: fila.notas ? descifrar(fila.notas) : null,
    };
}

// ── Controladores ────────────────────────────────────────────────────────────

// GET /api/calculos - Obtener cálculos del usuario actual (descifrados)
const obtenerMisCalculos = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM calculos WHERE user_id = ? ORDER BY fecha DESC',
            [req.usuario.id]
        );

        const datos = rows.map(descifrarFila);
        res.json({ success: true, data: datos });
    } catch (error) {
        console.error('Error al obtener cálculos:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener cálculos.' });
    }
};

// POST /api/calculos - Guardar un nuevo cálculo (cifrado en BD)
const crear = async (req, res) => {
    const { ancho, largo, dosis, notas } = req.body;
    const user_id = req.usuario.id;

    if (ancho === undefined || largo === undefined || dosis === undefined) {
        return res.status(400).json({
            success: false,
            mensaje: 'Ancho, largo y dosis son requeridos.'
        });
    }

    // Cálculo real (en texto plano antes de cifrar)
    const area = parseFloat(ancho) * parseFloat(largo);
    const resultado = (area * parseFloat(dosis)) / 10000;

    // Cifrar todos los campos sensibles
    const anchoCifrado = cifrar(ancho);
    const largoCifrado = cifrar(largo);
    const dosisCifrada = cifrar(dosis);
    const resultadoCifrado = cifrar(resultado);
    const notasCifradas = notas ? cifrar(notas) : null;

    try {
        const [result] = await pool.execute(
            'INSERT INTO calculos (ancho, largo, dosis, resultado, notas, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [anchoCifrado, largoCifrado, dosisCifrada, resultadoCifrado, notasCifradas, user_id]
        );

        // Devolver al usuario los datos descifrados (legibles)
        const [nuevo] = await pool.execute('SELECT * FROM calculos WHERE id = ?', [result.insertId]);
        res.status(201).json({
            success: true,
            mensaje: 'Cálculo guardado exitosamente.',
            data: descifrarFila(nuevo[0])
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
