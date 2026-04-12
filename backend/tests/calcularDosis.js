/**
 * calcularDosis.js
 *
 * Función pura extraída de calculosController.js (backend/controllers/calculosController.js).
 * Calcula la cantidad de plaguicida necesaria para un área dada.
 *
 * Fórmula:
 *   area (m²)   = ancho  × largo
 *   resultado   = (area  × dosis) / 10 000
 *
 * El resultado expresa la cantidad de producto a aplicar
 * en las mismas unidades que "dosis", escaladas a la hectárea.
 *
 * @param {number} ancho   - Ancho del terreno en metros
 * @param {number} largo   - Largo del terreno en metros
 * @param {number} dosis   - Dosis de plaguicida (ej. mL/ha o g/ha)
 * @returns {number}       - Cantidad de plaguicida necesaria
 * @throws {TypeError}     - Si algún parámetro no es un número finito válido
 */
function calcularDosis(ancho, largo, dosis) {
    // Validación de tipos
    if (
        typeof ancho  !== 'number' || !isFinite(ancho)  ||
        typeof largo  !== 'number' || !isFinite(largo)  ||
        typeof dosis  !== 'number' || !isFinite(dosis)
    ) {
        throw new TypeError('Los parámetros ancho, largo y dosis deben ser números finitos válidos.');
    }

    const area      = ancho * largo;
    const resultado = (area * dosis) / 10000;
    return resultado;
}

module.exports = { calcularDosis };
