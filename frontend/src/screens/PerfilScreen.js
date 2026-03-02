import React from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';

export default function PerfilScreen() {
    const { usuario, logout, esAdmin } = useAuth();
    const { t, idioma, cambiarIdioma } = useLanguage();

    const handleLogout = () => {
        Alert.alert(t.logout, '¿Deseas cerrar sesión?', [
            { text: t.cancel, style: 'cancel' },
            { text: t.logout, style: 'destructive', onPress: logout },
        ]);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.headerBg}>
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
            <View style={styles.card}>
                <Text style={styles.cardTitle}>📋 Información de cuenta</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>📧</Text>
                    <View>
                        <Text style={styles.infoLabel}>Correo</Text>
                        <Text style={styles.infoValue}>{usuario?.correo}</Text>
                    </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>🔐</Text>
                    <View>
                        <Text style={styles.infoLabel}>Tipo de cuenta</Text>
                        <Text style={[styles.infoValue, esAdmin() && { color: COLORS.secondary }]}>
                            {esAdmin() ? 'Administrador' : 'Usuario estándar'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Selector de idioma */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>🌐 {t.language}</Text>
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
            <View style={styles.card}>
                <Text style={styles.cardTitle}>🌿 Ce-Kalan</Text>
                <Text style={styles.appVersion}>Versión 1.0.0</Text>
                <Text style={styles.appDesc}>
                    Herramienta agrícola de gestión de plaguicidas y cálculo de dosis.
                    Desarrollado para optimizar el manejo responsable de agroquímicos.
                </Text>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutBtnText}>🚪 {t.logout}</Text>
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
    appVersion: { fontSize: 13, color: COLORS.textLight, marginBottom: SPACING.sm },
    appDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
    logoutBtn: {
        backgroundColor: '#FFEBEE', marginHorizontal: SPACING.md, marginTop: SPACING.md,
        borderRadius: 16, paddingVertical: 16, alignItems: 'center',
        borderWidth: 1.5, borderColor: '#FFCDD2',
    },
    logoutBtnText: { color: COLORS.error, fontWeight: '700', fontSize: 16 },
});
