// ============================================================
// Ce-Kalan - Validación y Saneamiento de Entradas
// ============================================================
// NUNCA confíes en los datos del usuario.
// Todas las entradas deben pasar por estas funciones.
// ============================================================

/**
 * Sanea una cadena: recorta espacios y elimina caracteres peligrosos.
 * Previene XSS e inyección básica.
 */
export const sanitize = (value) => {
    if (typeof value !== 'string') return '';
    return value
        .trim()
        .replace(/[<>"'`;]/g, '') // elimina caracteres de inyección HTML/JS/SQL
        .substring(0, 500);        // límite máximo absoluto
};

/**
 * Valida formato de correo electrónico.
 */
export const isValidEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    return regex.test(String(email).toLowerCase());
};

/**
 * Valida que la contraseña cumpla requisitos mínimos de seguridad.
 * Al menos 6 caracteres.
 */
export const isValidPassword = (password) => {
    if (typeof password !== 'string') return false;
    return password.length >= 6 && password.length <= 128;
};

/**
 * Valida que un nombre sea texto plano sin caracteres peligrosos.
 * Máx. 100 caracteres.
 */
export const isValidNombre = (nombre) => {
    if (typeof nombre !== 'string') return false;
    const sanitized = sanitize(nombre);
    return sanitized.length >= 2 && sanitized.length <= 100;
};

/**
 * Valida que un valor sea un número positivo finito.
 */
export const isPositiveNumber = (value) => {
    const n = parseFloat(value);
    return !isNaN(n) && isFinite(n) && n > 0;
};

/**
 * Valida formato de fecha YYYY-MM-DD.
 */
export const isValidDate = (dateStr) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
};

/**
 * Limita la longitud de un string a maxLen y lo sanea.
 */
export const limitAndSanitize = (value, maxLen = 200) => {
    return sanitize(value).substring(0, maxLen);
};

/**
 * Valida los campos del formulario de login.
 * Retorna { valid: bool, error: string }
 */
export const validateLogin = (correo, password) => {
    if (!correo || !correo.trim()) return { valid: false, error: 'El correo es requerido.' };
    if (!isValidEmail(correo.trim())) return { valid: false, error: 'Formato de correo inválido.' };
    if (!password) return { valid: false, error: 'La contraseña es requerida.' };
    if (!isValidPassword(password)) return { valid: false, error: 'La contraseña debe tener entre 6 y 128 caracteres.' };
    return { valid: true, error: null };
};

/**
 * Valida los campos del formulario de registro.
 */
export const validateRegistro = (nombre, correo, password) => {
    if (!nombre || !nombre.trim()) return { valid: false, error: 'El nombre es requerido.' };
    if (!isValidNombre(nombre)) return { valid: false, error: 'Nombre inválido (máx. 100 caracteres, sin caracteres especiales).' };
    if (!correo || !correo.trim()) return { valid: false, error: 'El correo es requerido.' };
    if (!isValidEmail(correo.trim())) return { valid: false, error: 'Formato de correo inválido.' };
    if (!password) return { valid: false, error: 'La contraseña es requerida.' };
    if (!isValidPassword(password)) return { valid: false, error: 'La contraseña debe tener entre 6 y 128 caracteres.' };
    return { valid: true, error: null };
};

/**
 * Valida los campos de la calculadora de dosis.
 */
export const validateCalculadora = (ancho, largo, dosis) => {
    if (!ancho || !largo || !dosis) return { valid: false, error: 'Todos los campos son requeridos.' };
    if (!isPositiveNumber(ancho)) return { valid: false, error: 'El ancho debe ser un número positivo.' };
    if (!isPositiveNumber(largo)) return { valid: false, error: 'El largo debe ser un número positivo.' };
    if (!isPositiveNumber(dosis)) return { valid: false, error: 'La dosis debe ser un número positivo.' };
    const a = parseFloat(ancho), l = parseFloat(largo), d = parseFloat(dosis);
    if (a > 100000) return { valid: false, error: 'El ancho excede el máximo permitido (100,000 m).' };
    if (l > 100000) return { valid: false, error: 'El largo excede el máximo permitido (100,000 m).' };
    if (d > 10000) return { valid: false, error: 'La dosis excede el máximo permitido (10,000 L/ha).' };
    return { valid: true, error: null };
};

/**
 * Valida los campos de un evento de calendario.
 */
export const validateEvento = (titulo, fecha) => {
    if (!titulo || !titulo.trim()) return { valid: false, error: 'El título es requerido.' };
    if (titulo.trim().length > 200) return { valid: false, error: 'El título es demasiado largo (máx. 200 caracteres).' };
    if (!fecha) return { valid: false, error: 'Selecciona un día en el calendario.' };
    if (!isValidDate(fecha)) return { valid: false, error: 'Fecha inválida.' };
    return { valid: true, error: null };
};

/**
 * Valida los campos de un plaguicida.
 */
export const validatePlaguicida = (nombre, tipo) => {
    if (!nombre || !nombre.trim()) return { valid: false, error: 'El nombre del plaguicida es requerido.' };
    if (nombre.trim().length > 150) return { valid: false, error: 'El nombre es demasiado largo (máx. 150 caracteres).' };
    if (!tipo || !tipo.trim()) return { valid: false, error: 'El tipo de plaguicida es requerido.' };
    if (tipo.trim().length > 100) return { valid: false, error: 'El tipo es demasiado largo (máx. 100 caracteres).' };
    return { valid: true, error: null };
};
