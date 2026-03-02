import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import translations from '../constants/translations';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
    const [idioma, setIdioma] = useState('es');
    const t = translations[idioma];

    useEffect(() => {
        const cargarIdioma = async () => {
            try {
                const idiomaGuardado = await AsyncStorage.getItem('cekalan_idioma');
                if (idiomaGuardado) setIdioma(idiomaGuardado);
            } catch (e) { }
        };
        cargarIdioma();
    }, []);

    const cambiarIdioma = async (nuevoIdioma) => {
        setIdioma(nuevoIdioma);
        await AsyncStorage.setItem('cekalan_idioma', nuevoIdioma);
    };

    return (
        <LanguageContext.Provider value={{ idioma, t, cambiarIdioma }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage debe usarse dentro de LanguageProvider');
    return context;
};
