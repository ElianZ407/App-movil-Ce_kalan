// ============================================================
// Ce-Kalan - Configuración de la API
// ============================================================
// La IP y Puerto se leen EXCLUSIVAMENTE desde el archivo .env
//
// Para configurar:
//   1. Copia frontend/.env.example → frontend/.env
//   2. Edita .env y pon tu IP:
//      EXPO_PUBLIC_API_IP=192.168.X.X
//      EXPO_PUBLIC_API_PORT=3001
//
// El archivo .env NUNCA debe subirse a git.
// ============================================================

if (!process.env.EXPO_PUBLIC_API_IP) {
    throw new Error(
        '⚠️  EXPO_PUBLIC_API_IP no está definida.\n' +
        'Crea el archivo frontend/.env con tu IP local.\n' +
        'Ejemplo: EXPO_PUBLIC_API_IP=192.168.0.5'
    );
}

const API_IP = process.env.EXPO_PUBLIC_API_IP;
const API_PORT = process.env.EXPO_PUBLIC_API_PORT || '3001';

export const API_BASE_URL = `http://${API_IP}:${API_PORT}/api`;
export const UPLOADS_BASE_URL = `http://${API_IP}:${API_PORT}`;

export const ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTRO: `${API_BASE_URL}/auth/registro`,
    PERFIL: `${API_BASE_URL}/auth/perfil`,
    PLAGUICIDAS: `${API_BASE_URL}/plaguicidas`,
    CALCULOS: `${API_BASE_URL}/calculos`,
    EVENTOS: `${API_BASE_URL}/eventos`,
};
