import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, KeyboardAvoidingView, Platform, ScrollView,
    ActivityIndicator, StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';

export default function RegistroScreen({ navigation }) {
    const [nombre, setNombre] = useState('');
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [cargando, setCargando] = useState(false);
    const { registro } = useAuth();
    const { t } = useLanguage();

    const handleRegistro = async () => {
        if (!nombre.trim() || !correo.trim() || !password.trim()) {
            Alert.alert(t.error, t.required);
            return;
        }
        if (password.length < 6) {
            Alert.alert(t.error, 'La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        setCargando(true);
        try {
            await registro(nombre.trim(), correo.trim(), password);
        } catch (error) {
            const msg = error?.response?.data?.mensaje || 'Error al registrarse.';
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
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t.name}</Text>
                        <TextInput
                            style={styles.input}
                            value={nombre}
                            onChangeText={setNombre}
                            placeholder="Juan García"
                            placeholderTextColor={COLORS.textLight}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t.email}</Text>
                        <TextInput
                            style={styles.input}
                            value={correo}
                            onChangeText={setCorreo}
                            placeholder="correo@ejemplo.com"
                            placeholderTextColor={COLORS.textLight}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t.password}</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Mínimo 6 caracteres"
                            placeholderTextColor={COLORS.textLight}
                            secureTextEntry
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
    input: {
        backgroundColor: COLORS.surfaceGray, borderRadius: 12,
        paddingHorizontal: SPACING.md, paddingVertical: 14,
        fontSize: 15, color: COLORS.textPrimary,
        borderWidth: 1.5, borderColor: COLORS.border,
    },
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
