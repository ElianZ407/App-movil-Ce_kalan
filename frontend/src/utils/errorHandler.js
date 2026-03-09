// ============================================================
// Ce-Kalan - Manejo Seguro de Errores
// ============================================================
// NUNCA mostrar stack traces o mensajes técnicos al usuario.
// Usar siempre mensajes genéricos y amigables.
// ============================================================

/**
 * Extrae un mensaje seguro y amigable desde un error de Axios/API.
 * No expone detalles de infraestructura al usuario.
 *
 * @param {any} error - El error capturado en el catch
 * @param {string} contextMsg - Mensaje genérico para este contexto
 * @returns {string} Mensaje seguro para mostrar al usuario
 */
export const getErrorMessage = (error, contextMsg = 'Ha ocurrido un error. Intenta de nuevo.') => {
    // Error con respuesta del servidor (4xx, 5xx)
    if (error?.response) {
        const status = error.response.status;
        const serverMsg = error.response?.data?.mensaje;

        // Solo mostramos mensajes del servidor si son mensajes de negocio (no técnicos)
        if (serverMsg && typeof serverMsg === 'string' && serverMsg.length < 200) {
            // Filtramos mensajes que puedan contener info técnica
            const isTechnical = /stack|trace|mysql|sql|column|table|syntax|error at|line \d/i.test(serverMsg);
            if (!isTechnical) return serverMsg;
        }

        // Mensajes genéricos por código HTTP
        if (status === 400) return 'Los datos ingresados no son válidos. Verifica el formulario.';
        if (status === 401) return 'Sesión expirada. Por favor inicia sesión nuevamente.';
        if (status === 403) return 'No tienes permiso para realizar esta acción.';
        if (status === 404) return 'El recurso solicitado no fue encontrado.';
        if (status === 409) return 'Ya existe un registro con esos datos.';
        if (status >= 500) return 'Error en el servidor. Intenta más tarde.';
    }

    // Error de red (sin respuesta del servidor)
    if (error?.code === 'ECONNREFUSED' || error?.message?.includes('Network Error') || !error?.response) {
        return 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
    }

    // Error de timeout
    if (error?.code === 'ECONNABORTED') {
        return 'La solicitud tardó demasiado. Intenta de nuevo.';
    }

    return contextMsg;
};

/**
 * Registra el error de forma interna (para debug del desarrollador, no visible al usuario).
 * En producción, esto debería enviar a un servicio de logging como Sentry.
 *
 * @param {string} context - Nombre de la pantalla/función donde ocurrió
 * @param {any} error - El error capturado
 */
export const logError = (context, error) => {
    if (__DEV__) {
        // Solo en modo desarrollo se muestra el detalle en consola
        console.error(`[Ce-Kalan Error] ${context}:`, error?.message || error);
    }
    // En producción aquí iría: Sentry.captureException(error);
};

/**
 * Wrapper seguro para operaciones async.
 * Garantiza que ninguna excepción se propague sin manejar.
 *
 * @param {Function} fn - Función async a ejecutar
 * @param {string} context - Contexto para el log
 * @param {string} userMessage - Mensaje genérico para el usuario
 * @returns {Promise<{ data: any, error: string|null }>}
 */
export const safeAsync = async (fn, context = 'unknown', userMessage = undefined) => {
    try {
        const data = await fn();
        return { data, error: null };
    } catch (err) {
        logError(context, err);
        return { data: null, error: getErrorMessage(err, userMessage) };
    }
};
