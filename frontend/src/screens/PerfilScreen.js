import React from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch, StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';

export default function PerfilScreen() {
    const { usuario, logout, esAdmin } = useAuth();
    const { t, idioma, cambiarIdioma } = useLanguage();
    const { isDark, colors, toggleTheme } = useTheme();

    const handleLogout = () => {
        Alert.alert(t.logout, '¿Deseas cerrar sesión?', [
            { text: t.cancel, style: 'cancel' },
            { text: t.logout, style: 'destructive', onPress: logout },
        ]);
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
        >
            <StatusBar
                barStyle="light-content"
                backgroundColor={colors.primaryDark}
            />
            {/* Header */}
            <View style={[styles.headerBg, { backgroundColor: colors.primaryDark }]}>
                <View style={styles.avatarCircle}>
                    <Text style={styles.avatarEmoji}>
                        {esAdmin() ? '👨‍💼' : '👨‍🌾'}
                    </Text>
                </View>
                <Text style={styles.userName}>{usuario?.nombre}</Text>
                <View style={[styles.roleBadge, esAdmin() && styles.roleBadgeAdmin]}>
                    <Text style={styles.roleBadgeText}>
                        {esAdmin() ? '⭐ Admin' : '🌱 Usuario'}
                    </Text>
                </View>
            </View>

            {/* Info Card */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>📋 Información de cuenta</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>📧</Text>
                    <View>
                        <Text style={[styles.infoLabel, { color: colors.textLight }]}>Correo</Text>
                        <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{usuario?.correo}</Text>
                    </View>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>🔐</Text>
                    <View>
                        <Text style={[styles.infoLabel, { color: colors.textLight }]}>Tipo de cuenta</Text>
                        <Text style={[styles.infoValue, { color: esAdmin() ? colors.secondary : colors.textPrimary }]}>
                            {esAdmin() ? 'Administrador' : 'Usuario estándar'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Apariencia - Modo Oscuro */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                    {isDark ? '🌙' : '☀️'} {t.appearance}
                </Text>
                <View style={styles.toggleRow}>
                    <View>
                        <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>
                            {isDark ? t.darkMode : t.lightMode}
                        </Text>
                        <Text style={[styles.toggleSub, { color: colors.textLight }]}>
                            {isDark ? 'Tema oscuro activo' : 'Tema claro activo'}
                        </Text>
                    </View>
                    <Switch
                        value={isDark}
                        onValueChange={toggleTheme}
                        trackColor={{ false: colors.border, true: colors.primary + '88' }}
                        thumbColor={isDark ? colors.primary : colors.textLight}
                    />
                </View>
            </View>

            {/* Selector de idioma */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>🌐 {t.language}</Text>
                <View style={styles.langRow}>
                    <TouchableOpacity
                        style={[styles.langBtn, idioma === 'es' && styles.langBtnActive]}
                        onPress={() => cambiarIdioma('es')}
                    >
                        <Text style={[styles.langText, idioma === 'es' && styles.langTextActive]}>
                            🇲🇽 {t.spanish}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.langBtn, idioma === 'en' && styles.langBtnActive]}
                        onPress={() => cambiarIdioma('en')}
                    >
                        <Text style={[styles.langText, idioma === 'en' && styles.langTextActive]}>
                            🇺🇸 {t.english}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Estadísticas de la app */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>🌿 Ce-Kalan</Text>
                <Text style={[styles.appVersion, { color: colors.textLight }]}>Versión 1.0.0</Text>
                <Text style={[styles.appDesc, { color: colors.textSecondary }]}>
                    Herramienta agrícola de gestión de plaguicidas y cálculo de dosis.
                    Desarrollado para optimizar el manejo responsable de agroquímicos.
                </Text>
            </View>

            {/* Logout */}
            <TouchableOpacity
                style={[styles.logoutBtn, { backgroundColor: colors.isDark ? '#2D1010' : '#FFEBEE', borderColor: colors.isDark ? '#5C2020' : '#FFCDD2' }]}
                onPress={handleLogout}
            >
                <Text style={[styles.logoutBtnText, { color: colors.error }]}>🚪 {t.logout}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { paddingBottom: SPACING.xxl },
    headerBg: {
        backgroundColor: COLORS.primaryDark, paddingVertical: SPACING.xxl,
        alignItems: 'center', paddingTop: 60,
    },
    avatarCircle: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)', marginBottom: SPACING.md,
    },
    avatarEmoji: { fontSize: 44 },
    userName: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: SPACING.sm },
    roleBadge: {
        backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    },
    roleBadgeAdmin: { backgroundColor: 'rgba(255,160,0,0.3)', borderColor: COLORS.secondary },
    roleBadgeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    card: {
        backgroundColor: COLORS.surface, marginHorizontal: SPACING.md,
        marginTop: SPACING.md, borderRadius: 20, padding: SPACING.md, ...SHADOWS.small,
    },
    cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    infoIcon: { fontSize: 24 },
    infoLabel: { fontSize: 12, color: COLORS.textLight, marginBottom: 2 },
    infoValue: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
    divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
    langRow: { flexDirection: 'row', gap: SPACING.sm },
    langBtn: {
        flex: 1, borderRadius: 12, paddingVertical: SPACING.sm,
        alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border,
        backgroundColor: COLORS.surfaceGray,
    },
    langBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    langText: { color: COLORS.textSecondary, fontWeight: '600' },
    langTextActive: { color: '#fff' },
    toggleRow: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
    },
    toggleLabel: { fontSize: 15, fontWeight: '600' },
    toggleSub: { fontSize: 12, marginTop: 2 },
    appVersion: { fontSize: 13, color: COLORS.textLight, marginBottom: SPACING.sm },
    appDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
    logoutBtn: {
        backgroundColor: '#FFEBEE', marginHorizontal: SPACING.md, marginTop: SPACING.md,
        borderRadius: 16, paddingVertical: 16, alignItems: 'center',
        borderWidth: 1.5, borderColor: '#FFCDD2',
    },
    logoutBtnText: { color: COLORS.error, fontWeight: '700', fontSize: 16 },
});
