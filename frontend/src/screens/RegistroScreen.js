import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, KeyboardAvoidingView, Platform, ScrollView,
    ActivityIndicator, StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { validateRegistro, sanitize, isValidEmail } from '../utils/validation';
import { getErrorMessage, logError } from '../utils/errorHandler';

export default function RegistroScreen({ navigation }) {
    const [nombre, setNombre] = useState('');
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [cargando, setCargando] = useState(false);
    const [correoValido, setCorreoValido] = useState(null); // null=sin tocar, true=válido, false=inválido
    const [correoError, setCorreoError] = useState('');

    const { registro } = useAuth();
    const { t } = useLanguage();

    // Validación en tiempo real del correo
    const onCorreoChange = (valor) => {
        setCorreo(valor);
        setCorreoError('');
        if (valor.trim().length === 0) {
            setCorreoValido(null);
        } else if (isValidEmail(valor.trim())) {
            setCorreoValido(true);
        } else {
            setCorreoValido(false);
            setCorreoError('Formato inválido (ej: nombre@dominio.com)');
        }
    };

    const handleRegistro = async () => {
        const nombreSanitizado = sanitize(nombre);
        const correoSanitizado = sanitize(correo);

        const { valid, error } = validateRegistro(nombreSanitizado, correoSanitizado, password);
        if (!valid) {
            Alert.alert(t.error, error);
            return;
        }

        setCargando(true);
        try {
            await registro(nombreSanitizado, correoSanitizado, password);
            // ✅ Registro exitoso → ir al Login (no auto-login)
            Alert.alert(
                '✅ Cuenta creada',
                'Tu cuenta fue creada correctamente. Inicia sesión con tus credenciales.',
                [{
                    text: 'Ir al Login',
                    onPress: () => navigation.navigate('Login'),
                }]
            );
        } catch (err) {
            logError('RegistroScreen.handleRegistro', err);
            const msg = getErrorMessage(err, 'No se pudo completar el registro. Intenta de nuevo.');
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
                    <Text style={styles.logoEmoji}>🌱</Text>
                    <Text style={styles.appName}>Ce-Kalan</Text>
                    <Text style={styles.tagline}>{t.register}</Text>
                </View>

                <View style={styles.card}>

                    {/* Nombre */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t.name}</Text>
                        <TextInput
                            style={styles.input}
                            value={nombre}
                            onChangeText={setNombre}
                            placeholder="Juan García"
                            placeholderTextColor={COLORS.textLight}
                            maxLength={100}
                            autoCorrect={false}
                        />
                    </View>

                    {/* Correo con validación inline */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t.email}</Text>
                        <View style={[
                            styles.inputWrapper,
                            correoValido === true && styles.inputWrapperValid,
                            correoValido === false && styles.inputWrapperError,
                        ]}>
                            <TextInput
                                style={styles.inputInner}
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

                    {/* Contraseña */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t.password}</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Mínimo 6 caracteres"
                            placeholderTextColor={COLORS.textLight}
                            secureTextEntry
                            maxLength={128}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, cargando && styles.buttonDisabled]}
                        onPress={handleRegistro}
                        disabled={cargando}
                    >
                        {cargando
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.buttonText}>{t.register}</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.linkText}>
                            {t.haveAccount}{' '}
                            <Text style={styles.linkHighlight}>{t.login}</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.primaryDark },
    scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: SPACING.xxl },
    header: { alignItems: 'center', paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl },
    logoEmoji: { fontSize: 52, marginBottom: SPACING.sm },
    appName: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: 2, marginBottom: 4 },
    tagline: { fontSize: 16, color: 'rgba(255,255,255,0.7)' },
    card: {
        backgroundColor: COLORS.surface, marginHorizontal: SPACING.lg,
        borderRadius: 24, padding: SPACING.lg, ...SHADOWS.large,
    },
    inputGroup: { marginBottom: SPACING.md },
    label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs },

    // Campo normal
    input: {
        backgroundColor: COLORS.surfaceGray, borderRadius: 12,
        paddingHorizontal: SPACING.md, paddingVertical: 14,
        fontSize: 15, color: COLORS.textPrimary,
        borderWidth: 1.5, borderColor: COLORS.border,
    },

    // Wrapper del correo con borde dinámico
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.surfaceGray, borderRadius: 12,
        borderWidth: 1.5, borderColor: COLORS.border,
        overflow: 'hidden',
    },
    inputWrapperValid: { borderColor: '#2E7D32' },
    inputWrapperError: { borderColor: '#D32F2F' },
    inputInner: {
        flex: 1,
        paddingHorizontal: SPACING.md, paddingVertical: 14,
        fontSize: 15, color: COLORS.textPrimary,
    },
    inputIcon: { fontSize: 16, paddingRight: SPACING.sm },
    fieldError: { color: '#D32F2F', fontSize: 12, marginTop: 4 },

    button: {
        backgroundColor: COLORS.primary, borderRadius: 14,
        paddingVertical: 16, alignItems: 'center', marginTop: SPACING.sm, ...SHADOWS.medium,
    },
    buttonDisabled: { backgroundColor: COLORS.textLight },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    linkBtn: { marginTop: SPACING.md, alignItems: 'center' },
    linkText: { color: COLORS.textSecondary, fontSize: 14 },
    linkHighlight: { color: COLORS.primary, fontWeight: '700' },
});
