// ============================================================
// Ce-Kalan - Configuración de la API
// ============================================================
// La IP y Puerto se leen desde el archivo .env (EXPO_PUBLIC_*)
// Para cambiar la IP: edita frontend/.env
//   EXPO_PUBLIC_API_IP=192.168.X.X
//   EXPO_PUBLIC_API_PORT=3001
//
// Nunca hardcodees credenciales o IPs directamente aquí.
// ============================================================

const API_IP = process.env.EXPO_PUBLIC_API_IP || '192.168.0.5';
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
