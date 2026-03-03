// ============================================================
// Ce-Kalan - Configuración de la API
// ============================================================
// ⚠️ PASO OBLIGATORIO: Cambia API_IP por la IP de tu PC.
//
// Cómo encontrar tu IP en Windows:
//   1. Abre CMD (Símbolo del sistema)
//   2. Escribe: ipconfig
//   3. Busca "Dirección IPv4" debajo de tu adaptador WiFi
//      Ejemplo: 192.168.1.105
//
// ⚠️ Tu PC y tu iPhone deben estar en el mismo WiFi.
// ============================================================

const API_IP = '192.168.56.1'; // ✅ IP de tu laptop (Wi-Fi)
const API_PORT = '3001';

export const API_BASE_URL = `http://${API_IP}:${API_PORT}/api`;
export const UPLOADS_BASE_URL = `http://${API_IP}:${API_PORT}`;

// Endpoints
export const ENDPOINTS = {
    // Auth
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTRO: `${API_BASE_URL}/auth/registro`,
    PERFIL: `${API_BASE_URL}/auth/perfil`,
    // Plaguicidas
    PLAGUICIDAS: `${API_BASE_URL}/plaguicidas`,
    // Cálculos
    CALCULOS: `${API_BASE_URL}/calculos`,
    // Eventos
    EVENTOS: `${API_BASE_URL}/eventos`,
};
