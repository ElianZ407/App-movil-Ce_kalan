import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <LanguageProvider>
                    <AuthProvider>
                        <AppNavigator />
                    </AuthProvider>
                </LanguageProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
