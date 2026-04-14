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
// Ahora acepta plaguicida_id y unidad para descontar stock automáticamente
const crear = async (req, res) => {
    const { ancho, largo, dosis, notas, plaguicida_id, unidad = 'L' } = req.body;
    const user_id = req.usuario.id;

    if (ancho === undefined || largo === undefined || dosis === undefined) {
        return res.status(400).json({
            success: false,
            mensaje: 'Ancho, largo y dosis son requeridos.'
        });
    }

    // Validar unidad
    const unidadFinal = (unidad === 'mL' || unidad === 'L') ? unidad : 'L';

    // Cálculo real (en texto plano antes de cifrar)
    const a = parseFloat(ancho);
    const l = parseFloat(largo);
    const d = parseFloat(dosis);
    const area = a * l;
    const resultadoEnUnidad = (area * d) / 10000;

    // Convertir resultado a litros para descontar stock (stock siempre en L)
    const resultadoEnLitros = unidadFinal === 'mL'
        ? resultadoEnUnidad / 1000
        : resultadoEnUnidad;

    // ── Verificar stock del plaguicida (si se seleccionó uno) ──
    let plaguicida = null;
    if (plaguicida_id) {
        try {
            const [rows] = await pool.execute(
                'SELECT id, nombre, stock FROM plaguicidas WHERE id = ?',
                [plaguicida_id]
            );
            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    mensaje: 'Plaguicida no encontrado.'
                });
            }
            plaguicida = rows[0];

            // Verificar que haya stock suficiente
            if (plaguicida.stock !== null && resultadoEnLitros > parseFloat(plaguicida.stock)) {
                return res.status(400).json({
                    success: false,
                    mensaje: `Stock insuficiente. Disponible: ${parseFloat(plaguicida.stock).toFixed(2)} L, necesario: ${resultadoEnLitros.toFixed(4)} L.`
                });
            }
        } catch (error) {
            console.error('Error al verificar plaguicida:', error);
            return res.status(500).json({ success: false, mensaje: 'Error al verificar plaguicida.' });
        }
    }

    // Cifrar todos los campos sensibles
    const anchoCifrado = cifrar(ancho);
    const largoCifrado = cifrar(largo);
    const dosisCifrada = cifrar(dosis);
    const resultadoCifrado = cifrar(resultadoEnUnidad);
    const notasCifradas = notas ? cifrar(notas) : null;

    try {
        // Guardar el cálculo con referencia al plaguicida
        const [result] = await pool.execute(
            'INSERT INTO calculos (ancho, largo, dosis, resultado, notas, user_id, plaguicida_id, unidad) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [anchoCifrado, largoCifrado, dosisCifrada, resultadoCifrado, notasCifradas, user_id, plaguicida_id || null, unidadFinal]
        );

        // ── Descontar stock del plaguicida ──
        let stockActualizado = null;
        if (plaguicida && plaguicida.stock !== null) {
            const nuevoStock = Math.max(0, parseFloat(plaguicida.stock) - resultadoEnLitros);
            await pool.execute(
                'UPDATE plaguicidas SET stock = ?, updated_at = NOW() WHERE id = ?',
                [nuevoStock, plaguicida_id]
            );
            stockActualizado = nuevoStock;
        }

        // Devolver al usuario los datos descifrados (legibles)
        const [nuevo] = await pool.execute('SELECT * FROM calculos WHERE id = ?', [result.insertId]);
        const respuesta = {
            success: true,
            mensaje: 'Cálculo guardado exitosamente.',
            data: descifrarFila(nuevo[0])
        };

        // Agregar info del stock si se descontó
        if (stockActualizado !== null) {
            respuesta.stockInfo = {
                plaguicida: plaguicida.nombre,
                descontado: resultadoEnLitros,
                stockRestante: stockActualizado,
                alertaBajoStock: stockActualizado < 5,
            };
        }

        res.status(201).json(respuesta);
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
