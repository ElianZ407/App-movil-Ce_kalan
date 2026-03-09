// ============================================================
// Ce-Kalan - Módulo de Cifrado AES-256-GCM
// ============================================================
// Cifra y descifra datos sensibles antes de guardarlos en la BD.
// Usa AES-256-GCM: cifrado autenticado (detecta manipulaciones).
//
// Formato del texto cifrado guardado en BD:
//   iv:authTag:ciphertext  (todo en hex, separado por ":")
// ============================================================

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

/**
 * Obtiene la clave AES de forma lazy (en el primer uso).
 * Así se asegura que dotenv ya haya corrido cuando se llama.
 * .trim() tolera espacios/CRLF de Windows en archivos .env
 */
let _KEY = null;
function getKey() {
    if (_KEY) return _KEY;

    const KEY_HEX = (process.env.CALCULOS_ENCRYPTION_KEY || '').trim();

    if (!KEY_HEX || KEY_HEX.length !== 64) {
        throw new Error(
            '⚠️  CALCULOS_ENCRYPTION_KEY debe estar definida en .env ' +
            'con exactamente 64 caracteres hexadecimales (32 bytes).\n' +
            `   Valor actual: "${KEY_HEX}" (longitud: ${KEY_HEX.length})`
        );
    }

    _KEY = Buffer.from(KEY_HEX, 'hex');
    return _KEY;
}

/**
 * Cifra un valor y devuelve el texto cifrado en formato "iv:authTag:cipher"
 * @param {string|number} valor
 * @returns {string|null}
 */
function cifrar(valor) {
    if (valor === null || valor === undefined) return null;

    const KEY = getKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    const encrypted = Buffer.concat([
        cipher.update(String(valor), 'utf8'),
        cipher.final()
    ]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Descifra un valor almacenado en formato "iv:authTag:cipher"
 * @param {string} textoCifrado
 * @returns {string|null}
 */
function descifrar(textoCifrado) {
    if (!textoCifrado) return null;

    try {
        const partes = textoCifrado.split(':');
        if (partes.length !== 3) return textoCifrado; // No cifrado, devolver tal cual

        const KEY = getKey();
        const [ivHex, authTagHex, cipherHex] = partes;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const cipherData = Buffer.from(cipherHex, 'hex');

        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([
            decipher.update(cipherData),
            decipher.final()
        ]);

        return decrypted.toString('utf8');
    } catch (err) {
        console.error('Error al descifrar:', err.message);
        return null;
    }
}

module.exports = { cifrar, descifrar };
