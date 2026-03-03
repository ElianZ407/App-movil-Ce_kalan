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

    // Cargar sesión guardada de forma cifrada al iniciar
    useEffect(() => {
        const cargarSesion = async () => {
            try {
                const tokenGuardado = await SecureStore.getItemAsync(TOKEN_KEY);
                const usuarioGuardado = await SecureStore.getItemAsync(USUARIO_KEY);

                if (tokenGuardado && usuarioGuardado) {
                    setToken(tokenGuardado);
                    setUsuario(JSON.parse(usuarioGuardado));
                    axios.defaults.headers.common['Authorization'] = `Bearer ${tokenGuardado}`;
                }
            } catch (error) {
                // No exponemos detalles del error al usuario
                if (__DEV__) console.warn('[Ce-Kalan] Error al cargar sesión segura:', error?.message);
                // Si el SecureStore falla, limpiamos la sesión por seguridad
                await _limpiarSesion();
            } finally {
                setCargando(false);
            }
        };
        cargarSesion();
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
        const response = await axios.post(ENDPOINTS.REGISTRO, { nombre, correo, password });
        const { token: nuevoToken, usuario: nuevoUsuario } = response.data;

        setToken(nuevoToken);
        setUsuario(nuevoUsuario);
        axios.defaults.headers.common['Authorization'] = `Bearer ${nuevoToken}`;
        await _guardarSesion(nuevoToken, nuevoUsuario);

        return response.data;
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
