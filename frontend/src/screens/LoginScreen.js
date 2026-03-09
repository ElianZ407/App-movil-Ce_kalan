import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, KeyboardAvoidingView, Platform, ScrollView,
    ActivityIndicator, StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { validateLogin, sanitize, isValidEmail } from '../utils/validation';
import { getErrorMessage, logError } from '../utils/errorHandler';

export default function LoginScreen({ navigation }) {
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [cargando, setCargando] = useState(false);
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [correoError, setCorreoError] = useState('');
    const [correoValido, setCorreoValido] = useState(null); // null=sin tocar, true=válido, false=inválido

    const { login } = useAuth();
    const { t, idioma, cambiarIdioma } = useLanguage();

    // Validación en tiempo real del correo
    const onCorreoChange = (valor) => {
        setCorreo(valor);
        setCorreoError('');
        if (valor.trim().length === 0) {
            setCorreoValido(null);
        } else if (isValidEmail(valor.trim())) {
            setCorreoValido(true);
            setCorreoError('');
        } else {
            setCorreoValido(false);
            setCorreoError('Formato de correo inválido (ej: nombre@dominio.com)');
        }
    };

    const handleLogin = async () => {
        // Limpiar errores previos
        setCorreoError('');

        // Sanitizar entradas antes de validar
        const correoSanitizado = sanitize(correo);

        // Validar ANTES de enviar al servidor
        const { valid, error } = validateLogin(correoSanitizado, password);
        if (!valid) {
            Alert.alert(t.error, error);
            return;
        }

        setCargando(true);
        try {
            await login(correoSanitizado, password);
            // Login exitoso → la navegación la maneja AppNavigator automáticamente
        } catch (err) {
            logError('LoginScreen.handleLogin', err);
            // Mensaje amigable, sin detalles técnicos
            const msg = getErrorMessage(err, 'No se pudo iniciar sesión. Verifica tus credenciales.');
            Alert.alert(t.error, msg);
        } finally {
            setCargando(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoEmoji}>🌿</Text>
                    </View>
                    <Text style={styles.appName}>Ce-Kalan</Text>
                    <Text style={styles.tagline}>{t.appTagline}</Text>

                    {/* Selector de idioma */}
                    <View style={styles.langRow}>
                        <TouchableOpacity
                            style={[styles.langBtn, idioma === 'es' && styles.langBtnActive]}
                            onPress={() => cambiarIdioma('es')}
                        >
                            <Text style={[styles.langText, idioma === 'es' && styles.langTextActive]}>🇲🇽 {t.spanish}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.langBtn, idioma === 'en' && styles.langBtnActive]}
                            onPress={() => cambiarIdioma('en')}
                        >
                            <Text style={[styles.langText, idioma === 'en' && styles.langTextActive]}>🇺🇸 {t.english}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{t.login}</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t.email}</Text>
                        <View style={[
                            styles.inputWrapper,
                            correoValido === true && styles.inputWrapperValid,
                            correoValido === false && styles.inputWrapperError,
                        ]}>
                            <TextInput
                                style={styles.input}
                                value={correo}
                                onChangeText={onCorreoChange}
                                placeholder="correo@ejemplo.com"
                                placeholderTextColor={COLORS.textLight}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                maxLength={150}
                            />
                            {correoValido === true && <Text style={styles.inputIcon}>✅</Text>}
                            {correoValido === false && <Text style={styles.inputIcon}>❌</Text>}
                        </View>
                        {correoError ? <Text style={styles.fieldError}>{correoError}</Text> : null}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t.password}</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="••••••••"
                                placeholderTextColor={COLORS.textLight}
                                secureTextEntry={!mostrarPassword}
                                maxLength={128}  // Límite de longitud en campo
                            />
                            <TouchableOpacity
                                style={styles.eyeBtn}
                                onPress={() => setMostrarPassword(!mostrarPassword)}
                            >
                                <Text style={styles.eyeIcon}>{mostrarPassword ? '🙈' : '👁️'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, cargando && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={cargando}
                    >
                        {cargando
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.buttonText}>{t.login}</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('Registro')}>
                        <Text style={styles.linkText}>
                            {t.noAccount}{' '}
                            <Text style={styles.linkHighlight}>{t.register}</Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>🌱 Agricultura Responsable 🌱</Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.primaryDark },
    scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: SPACING.xxl },
    header: { alignItems: 'center', paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl },
    logoContainer: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: SPACING.md,
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    },
    logoEmoji: { fontSize: 44 },
    appName: { fontSize: 38, fontWeight: '800', color: '#FFFFFF', letterSpacing: 2, marginBottom: 4 },
    tagline: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: SPACING.lg },
    langRow: { flexDirection: 'row', gap: SPACING.sm },
    langBtn: {
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
        borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    },
    langBtnActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
    langText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
    langTextActive: { color: COLORS.primaryDark, fontWeight: '700' },
    card: {
        backgroundColor: COLORS.surface, marginHorizontal: SPACING.lg,
        borderRadius: 24, padding: SPACING.lg, ...SHADOWS.large,
    },
    cardTitle: {
        fontSize: 22, fontWeight: '700', color: COLORS.textPrimary,
        marginBottom: SPACING.lg, textAlign: 'center',
    },
    inputGroup: { marginBottom: SPACING.md },
    label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs },
    input: {
        backgroundColor: COLORS.surfaceGray, borderRadius: 12,
        paddingHorizontal: SPACING.md, paddingVertical: 14,
        fontSize: 15, color: COLORS.textPrimary,
        borderWidth: 1.5, borderColor: COLORS.border,
    },
    fieldError: { color: '#D32F2F', fontSize: 12, marginTop: 4 },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.surfaceGray, borderRadius: 12,
        borderWidth: 1.5, borderColor: COLORS.border,
        overflow: 'hidden',
    },
    inputWrapperValid: { borderColor: '#2E7D32' },
    inputWrapperError: { borderColor: '#D32F2F' },
    inputIcon: { fontSize: 16, paddingRight: SPACING.sm },
    passwordContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.surfaceGray, borderRadius: 12,
        borderWidth: 1.5, borderColor: COLORS.border,
        paddingRight: SPACING.sm,
    },
    eyeBtn: { padding: SPACING.sm },
    eyeIcon: { fontSize: 18 },
    button: {
        backgroundColor: COLORS.primary, borderRadius: 14,
        paddingVertical: 16, alignItems: 'center',
        marginTop: SPACING.sm, ...SHADOWS.medium,
    },
    buttonDisabled: { backgroundColor: COLORS.textLight },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
    linkBtn: { marginTop: SPACING.md, alignItems: 'center' },
    linkText: { color: COLORS.textSecondary, fontSize: 14 },
    linkHighlight: { color: COLORS.primary, fontWeight: '700' },
    footer: { alignItems: 'center', marginTop: SPACING.xl },
    footerText: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
});
