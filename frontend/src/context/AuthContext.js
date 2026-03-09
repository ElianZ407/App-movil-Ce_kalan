import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { ENDPOINTS } from '../config/api';

// ============================================================
// SEGURIDAD: El token JWT y datos de usuario se almacenan
// usando expo-secure-store (Keychain en iOS / Keystore en Android)
// en lugar de AsyncStorage (texto plano).
// ============================================================

const TOKEN_KEY = 'cekalan_token';
const USUARIO_KEY = 'cekalan_usuario';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [usuario, setUsuario] = useState(null);
    const [token, setToken] = useState(null);
    const [cargando, setCargando] = useState(true);

    // ── Política de seguridad: login obligatorio al iniciar la app ────────
    // Por seguridad, la sesión NO se restaura automáticamente entre reinicios.
    // El token se cifra en SecureStore durante la sesión activa (cumpliendo
    // el requisito de cifrado en reposo), pero se limpia al cerrar la app.
    useEffect(() => {
        const iniciarApp = async () => {
            try {
                // Siempre limpiar sesión guardada → forzar login manual
                await SecureStore.deleteItemAsync(TOKEN_KEY);
                await SecureStore.deleteItemAsync(USUARIO_KEY);
                delete axios.defaults.headers.common['Authorization'];
            } catch (error) {
                if (__DEV__) console.warn('[Ce-Kalan] Error al limpiar sesión inicial:', error?.message);
            } finally {
                // usuario y token quedan en null → AppNavigator muestra Login
                setCargando(false);
            }
        };
        iniciarApp();

        // ── Interceptor global de axios ──────────────────────────
        // Si el servidor responde 401 (token expirado) o 403 (token inválido)
        // en cualquier llamada autenticada, cerramos sesión de forma segura.
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const status = error?.response?.status;
                const isAuthEndpoint = error?.config?.url?.includes('/auth/login') ||
                    error?.config?.url?.includes('/auth/registro');

                if ((status === 401 || status === 403) && !isAuthEndpoint) {
                    if (__DEV__) console.warn('[Ce-Kalan] Sesión inválida detectada, cerrando sesión...');
                    try {
                        await SecureStore.deleteItemAsync(TOKEN_KEY);
                        await SecureStore.deleteItemAsync(USUARIO_KEY);
                    } catch (_) { /* ignorar */ }
                    delete axios.defaults.headers.common['Authorization'];
                    setToken(null);
                    setUsuario(null);
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);



    // Guarda el token y usuario de forma cifrada
    const _guardarSesion = async (nuevoToken, nuevoUsuario) => {
        try {
            await SecureStore.setItemAsync(TOKEN_KEY, nuevoToken);
            await SecureStore.setItemAsync(USUARIO_KEY, JSON.stringify(nuevoUsuario));
        } catch (error) {
            if (__DEV__) console.warn('[Ce-Kalan] Error al guardar sesión segura:', error?.message);
            throw new Error('No se pudo guardar la sesión de forma segura.');
        }
    };

    // Elimina el token y usuario del almacén cifrado
    const _limpiarSesion = async () => {
        try {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(USUARIO_KEY);
        } catch (error) {
            if (__DEV__) console.warn('[Ce-Kalan] Error al limpiar sesión:', error?.message);
        }
    };

    const login = async (correo, password) => {
        const response = await axios.post(ENDPOINTS.LOGIN, { correo, password });
        const { token: nuevoToken, usuario: nuevoUsuario } = response.data;

        setToken(nuevoToken);
        setUsuario(nuevoUsuario);
        axios.defaults.headers.common['Authorization'] = `Bearer ${nuevoToken}`;
        await _guardarSesion(nuevoToken, nuevoUsuario);

        return response.data;
    };

    const registro = async (nombre, correo, password) => {
        // Solo crea la cuenta — NO inicia sesión automáticamente.
        // El usuario debe ir al Login y autenticarse manualmente.
        const response = await axios.post(ENDPOINTS.REGISTRO, { nombre, correo, password });
        return response.data; // { success, mensaje, usuario }
    };

    const logout = async () => {
        setToken(null);
        setUsuario(null);
        delete axios.defaults.headers.common['Authorization'];
        await _limpiarSesion();
    };

    const esAdmin = () => usuario?.tipo === 'admin';

    return (
        <AuthContext.Provider value={{ usuario, token, cargando, login, registro, logout, esAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
    return context;
};
