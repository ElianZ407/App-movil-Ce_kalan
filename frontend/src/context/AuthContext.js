import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL, ENDPOINTS } from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [usuario, setUsuario] = useState(null);
    const [token, setToken] = useState(null);
    const [cargando, setCargando] = useState(true);

    // Cargar sesión guardada al iniciar
    useEffect(() => {
        const cargarSesion = async () => {
            try {
                const tokenGuardado = await AsyncStorage.getItem('cekalan_token');
                const usuarioGuardado = await AsyncStorage.getItem('cekalan_usuario');

                if (tokenGuardado && usuarioGuardado) {
                    setToken(tokenGuardado);
                    setUsuario(JSON.parse(usuarioGuardado));
                    axios.defaults.headers.common['Authorization'] = `Bearer ${tokenGuardado}`;
                }
            } catch (error) {
                console.error('Error al cargar sesión:', error);
            } finally {
                setCargando(false);
            }
        };
        cargarSesion();
    }, []);

    const login = async (correo, password) => {
        const response = await axios.post(ENDPOINTS.LOGIN, { correo, password });
        const { token: nuevoToken, usuario: nuevoUsuario } = response.data;

        setToken(nuevoToken);
        setUsuario(nuevoUsuario);
        axios.defaults.headers.common['Authorization'] = `Bearer ${nuevoToken}`;

        await AsyncStorage.setItem('cekalan_token', nuevoToken);
        await AsyncStorage.setItem('cekalan_usuario', JSON.stringify(nuevoUsuario));

        return response.data;
    };

    const registro = async (nombre, correo, password) => {
        const response = await axios.post(ENDPOINTS.REGISTRO, { nombre, correo, password });
        const { token: nuevoToken, usuario: nuevoUsuario } = response.data;

        setToken(nuevoToken);
        setUsuario(nuevoUsuario);
        axios.defaults.headers.common['Authorization'] = `Bearer ${nuevoToken}`;

        await AsyncStorage.setItem('cekalan_token', nuevoToken);
        await AsyncStorage.setItem('cekalan_usuario', JSON.stringify(nuevoUsuario));

        return response.data;
    };

    const logout = async () => {
        setToken(null);
        setUsuario(null);
        delete axios.defaults.headers.common['Authorization'];
        await AsyncStorage.removeItem('cekalan_token');
        await AsyncStorage.removeItem('cekalan_usuario');
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
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
};
