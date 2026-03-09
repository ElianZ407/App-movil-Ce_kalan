// ============================================================
// Ce-Kalan - Contexto de Tema (Modo Claro / Oscuro)
// ============================================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const THEME_KEY = 'cekalan_theme';

// ─── Paleta Claro ───────────────────────────────────────────
const LIGHT = {
    isDark: false,
    primary: '#2E7D32',
    primaryDark: '#1B5E20',
    primaryLight: '#4CAF50',
    primaryMedium: '#388E3C',
    secondary: '#FFA000',
    secondaryDark: '#FF6F00',
    secondaryLight: '#FFD54F',
    accent: '#FFCA28',
    background: '#F1F8E9',
    surface: '#FFFFFF',
    surfaceGray: '#F5F5F5',
    surfaceElevated: '#FFFFFF',
    textPrimary: '#1B2A1E',
    textSecondary: '#4A694D',
    textLight: '#78909C',
    textWhite: '#FFFFFF',
    success: '#43A047',
    warning: '#FFA000',
    error: '#C62828',
    info: '#0277BD',
    border: '#C8E6C9',
    shadow: 'rgba(46, 125, 50, 0.15)',
    tabBar: '#1B5E20',
    tabBarBorder: 'transparent',
    cardOverlay: 'rgba(0,0,0,0.6)',
    statCard1: '#E8F5E9',
    statCard2: '#FFF8E1',
    statCard3: '#E3F2FD',
    statCard4: '#FCE4EC',
    statText1: '#2E7D32',
    statText2: '#E65100',
    statText3: '#1565C0',
    statText4: '#880E4F',
};

// ─── Paleta Oscura ──────────────────────────────────────────
const DARK = {
    isDark: true,
    primary: '#4CAF50',
    primaryDark: '#0D2B0F',
    primaryLight: '#81C784',
    primaryMedium: '#388E3C',
    secondary: '#FFB300',
    secondaryDark: '#FF8F00',
    secondaryLight: '#FFD54F',
    accent: '#FFCA28',
    background: '#0F1A10',
    surface: '#1A2E1B',
    surfaceGray: '#243526',
    surfaceElevated: '#243526',
    textPrimary: '#E8F5E9',
    textSecondary: '#A5D6A7',
    textLight: '#6A9B6D',
    textWhite: '#FFFFFF',
    success: '#66BB6A',
    warning: '#FFB300',
    error: '#EF5350',
    info: '#42A5F5',
    border: '#2E4D30',
    shadow: 'rgba(0, 0, 0, 0.4)',
    tabBar: '#0D2B0F',
    tabBarBorder: '#1A2E1B',
    cardOverlay: 'rgba(0,0,0,0.75)',
    statCard1: '#1A3A1C',
    statCard2: '#2E2000',
    statCard3: '#0D1F3C',
    statCard4: '#2E0D1A',
    statText1: '#81C784',
    statText2: '#FFB74D',
    statText3: '#64B5F6',
    statText4: '#F48FB1',
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(false);
    const [colors, setColors] = useState(LIGHT);

    // Cargar preferencia guardada
    useEffect(() => {
        const cargarTema = async () => {
            try {
                const guardado = await SecureStore.getItemAsync(THEME_KEY);
                if (guardado === 'dark') {
                    setIsDark(true);
                    setColors(DARK);
                }
            } catch (e) {
                // Usar tema claro por defecto
            }
        };
        cargarTema();
    }, []);

    const toggleTheme = async () => {
        const nuevoModo = !isDark;
        setIsDark(nuevoModo);
        setColors(nuevoModo ? DARK : LIGHT);
        try {
            await SecureStore.setItemAsync(THEME_KEY, nuevoModo ? 'dark' : 'light');
        } catch (e) { /* ignorar */ }
    };

    return (
        <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
    return ctx;
};
