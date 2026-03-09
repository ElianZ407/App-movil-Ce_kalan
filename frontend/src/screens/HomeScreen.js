import React, { useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import axios from 'axios';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { SPACING, SHADOWS } from '../constants/theme';
import { logError } from '../utils/errorHandler';

export default function HomeScreen() {
    const [stats, setStats] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const { usuario, esAdmin } = useAuth();
    const { t } = useLanguage();
    const { colors } = useTheme();
    const navigation = useNavigation();

    const cargarStats = useCallback(async () => {
        setError(false);
        try {
            const res = await axios.get(ENDPOINTS.STATS);
            setStats(res.data.data);
        } catch (e) {
            logError('HomeScreen.cargarStats', e);
            setError(true); // Muestra mensaje de error amigable
        } finally {
            setCargando(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        setCargando(true);
        setError(false);
        cargarStats();
    }, [cargarStats]));

    const onRefresh = () => {
        setRefreshing(true);
        cargarStats();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getDaysUntil = (dateStr) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(dateStr + 'T00:00:00');
        const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Hoy';
        if (diff === 1) return 'Mañana';
        return `En ${diff} días`;
    };

    const s = makeStyles(colors);

    return (
        <View style={s.container}>
            <StatusBar
                barStyle="light-content"
                backgroundColor={colors.primaryDark}
            />
            <ScrollView
                contentContainerStyle={s.scroll}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.secondary}
                        colors={[colors.primary]}
                    />
                }
            >
                {/* ── Header ── */}
                <View style={s.header}>
                    <View>
                        <Text style={s.greeting}>
                            {new Date().getHours() < 12 ? '🌅 Buenos días' :
                                new Date().getHours() < 18 ? '☀️ Buenas tardes' : '🌙 Buenas noches'}
                        </Text>
                        <Text style={s.userName}>{usuario?.nombre?.split(' ')[0]}</Text>
                        <Text style={s.subtitle}>{t.appTagline}</Text>
                    </View>
                    <View style={s.avatarCircle}>
                        <Text style={s.avatarEmoji}>{esAdmin() ? '👨‍💼' : '👨‍🌾'}</Text>
                    </View>
                </View>

                {cargando ? (
                    <ActivityIndicator
                        color={colors.secondary}
                        size="large"
                        style={{ marginTop: SPACING.xxl }}
                    />
                ) : error || !stats ? (
                    // Error card — amigable, sin información técnica
                    <View style={[s.card, { marginTop: SPACING.xl, alignItems: 'center' }]}>
                        <Text style={{ fontSize: 40, marginBottom: SPACING.sm }}>📡</Text>
                        <Text style={[s.sectionTitle, { textAlign: 'center', marginHorizontal: 0 }]}>
                            Sin conexión al servidor
                        </Text>
                        <Text style={[s.emptyText, { marginBottom: SPACING.md }]}>
                            No se pudieron cargar los datos. Verifica que el servidor esté activo y jalá hacia abajo para reintentar.
                        </Text>
                        <TouchableOpacity
                            style={[s.quickBtn, { backgroundColor: colors.primary, paddingHorizontal: SPACING.lg, flex: 0 }]}
                            onPress={onRefresh}
                        >
                            <Text style={[s.quickLabel, { fontSize: 14 }]}>🔄 Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* ── Tarjetas de estadísticas ── */}
                        <View style={s.statsGrid}>
                            <View style={[s.statCard, { backgroundColor: colors.statCard1 }]}>
                                <Text style={s.statEmoji}>🧴</Text>
                                <Text style={[s.statNumber, { color: colors.statText1 }]}>
                                    {stats?.total_plaguicidas ?? 0}
                                </Text>
                                <Text style={[s.statLabel, { color: colors.statText1 }]}>
                                    {t.totalPesticides}
                                </Text>
                            </View>
                            <View style={[s.statCard, { backgroundColor: colors.statCard2 }]}>
                                <Text style={s.statEmoji}>🧪</Text>
                                <Text style={[s.statNumber, { color: colors.statText2 }]}>
                                    {stats?.total_calculos ?? 0}
                                </Text>
                                <Text style={[s.statLabel, { color: colors.statText2 }]}>
                                    {t.totalCalculations}
                                </Text>
                            </View>
                            <View style={[s.statCard, { backgroundColor: colors.statCard3 }]}>
                                <Text style={s.statEmoji}>📅</Text>
                                <Text style={[s.statNumber, { color: colors.statText3 }]}>
                                    {stats?.proximos_eventos?.length ?? 0}
                                </Text>
                                <Text style={[s.statLabel, { color: colors.statText3 }]}>
                                    {t.upcomingEvents}
                                </Text>
                            </View>
                            <View style={[s.statCard, { backgroundColor: colors.statCard4 }]}>
                                <Text style={s.statEmoji}>⚠️</Text>
                                <Text style={[s.statNumber, { color: colors.statText4 }]}>
                                    {stats?.stock_bajo?.length ?? 0}
                                </Text>
                                <Text style={[s.statLabel, { color: colors.statText4 }]}>
                                    {t.lowStock}
                                </Text>
                            </View>
                        </View>

                        {/* ── Alertas de stock bajo ── */}
                        <Text style={s.sectionTitle}>⚠️ {t.lowStockAlert}</Text>
                        <View style={s.card}>
                            {!stats.stock_bajo || stats.stock_bajo.length === 0 ? (
                                <Text style={s.emptyText}>{t.noAlerts}</Text>
                            ) : (
                                stats.stock_bajo.map((p) => (
                                    <View key={p.id} style={s.alertRow}>
                                        <View style={s.alertDot} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={s.alertName}>{p.nombre}</Text>
                                            <Text style={s.alertStock}>
                                                Stock: {parseFloat(p.stock).toFixed(2)} L
                                                {parseFloat(p.stock) === 0 ? ' 🚨 Sin stock' : ' ⚠️ Bajo'}
                                            </Text>
                                        </View>
                                        {esAdmin() && (
                                            <TouchableOpacity
                                                style={s.alertBtn}
                                                onPress={() => navigation.navigate('Plaguicidas')}
                                            >
                                                <Text style={s.alertBtnText}>Gestionar</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))
                            )}
                        </View>

                        {/* ── Último cálculo ── */}
                        <Text style={s.sectionTitle}>🧪 {t.lastCalculation}</Text>
                        <View style={s.card}>
                            {stats?.ultimo_calculo ? (
                                <View>
                                    <Text style={s.lastCalcValue}>
                                        {parseFloat(stats.ultimo_calculo.resultado).toFixed(4)}
                                        <Text style={s.lastCalcUnit}> L</Text>
                                    </Text>
                                    <Text style={s.lastCalcDetail}>
                                        {stats.ultimo_calculo.ancho}m × {stats.ultimo_calculo.largo}m
                                        {'  •  '}{stats.ultimo_calculo.dosis} L/ha
                                    </Text>
                                    <Text style={s.lastCalcDate}>
                                        {formatDate(stats.ultimo_calculo.fecha)}
                                    </Text>
                                    <TouchableOpacity
                                        style={s.viewAllBtn}
                                        onPress={() => navigation.navigate('Calculadora')}
                                    >
                                        <Text style={s.viewAllText}>📋 {t.viewAll}</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <Text style={s.emptyText}>{t.noRecentCalc}</Text>
                            )}
                        </View>

                        {/* ── Próximos eventos ── */}
                        <Text style={s.sectionTitle}>📅 {t.upcomingEvents}</Text>
                        <View style={s.card}>
                            {!stats.proximos_eventos || stats.proximos_eventos.length === 0 ? (
                                <Text style={s.emptyText}>{t.noUpcomingEvents}</Text>
                            ) : (
                                stats.proximos_eventos.map((ev, idx) => (
                                    <View
                                        key={idx}
                                        style={[
                                            s.eventRow,
                                            idx < stats.proximos_eventos.length - 1 && s.eventRowBorder,
                                        ]}
                                    >
                                        <View style={[s.eventColorDot, { backgroundColor: ev.color || colors.primary }]} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={s.eventTitle}>{ev.titulo}</Text>
                                            <Text style={s.eventDate}>{formatDate(ev.fecha)}</Text>
                                        </View>
                                        <View style={[s.eventBadge, { backgroundColor: (ev.color || colors.primary) + '22' }]}>
                                            <Text style={[s.eventBadgeText, { color: ev.color || colors.primary }]}>
                                                {getDaysUntil(ev.fecha)}
                                            </Text>
                                        </View>
                                    </View>
                                ))
                            )}
                            {stats.proximos_eventos?.length > 0 && (
                                <TouchableOpacity
                                    style={s.viewAllBtn}
                                    onPress={() => navigation.navigate('Calendario')}
                                >
                                    <Text style={s.viewAllText}>📅 {t.viewAll}</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* ── Acciones rápidas ── */}
                        <Text style={s.sectionTitle}>⚡ {t.quickActions}</Text>
                        <View style={s.quickRow}>
                            <TouchableOpacity
                                style={[s.quickBtn, { backgroundColor: colors.primary }]}
                                onPress={() => navigation.navigate('Calculadora')}
                            >
                                <Text style={s.quickEmoji}>🧪</Text>
                                <Text style={s.quickLabel}>{t.calculator}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.quickBtn, { backgroundColor: '#1565C0' }]}
                                onPress={() => navigation.navigate('Calendario')}
                            >
                                <Text style={s.quickEmoji}>📅</Text>
                                <Text style={s.quickLabel}>{t.calendar}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.quickBtn, { backgroundColor: colors.secondaryDark }]}
                                onPress={() => navigation.navigate('Plaguicidas')}
                            >
                                <Text style={s.quickEmoji}>🧴</Text>
                                <Text style={s.quickLabel}>{t.pesticides}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ height: SPACING.xxl }} />
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const makeStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingBottom: SPACING.xl },

    header: {
        backgroundColor: colors.primaryDark,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.xxl + 8,
        paddingBottom: SPACING.xl,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
    userName: { fontSize: 28, fontWeight: '800', color: '#fff' },
    subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
    avatarCircle: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarEmoji: { fontSize: 28 },

    statsGrid: {
        flexDirection: 'row', flexWrap: 'wrap',
        paddingHorizontal: SPACING.md, paddingTop: SPACING.md, gap: SPACING.sm,
    },
    statCard: {
        flex: 1, minWidth: '45%', borderRadius: 16,
        padding: SPACING.md, alignItems: 'center', ...SHADOWS.small,
    },
    statEmoji: { fontSize: 28, marginBottom: 4 },
    statNumber: { fontSize: 28, fontWeight: '800' },
    statLabel: { fontSize: 12, fontWeight: '600', marginTop: 2, textAlign: 'center' },

    sectionTitle: {
        fontSize: 16, fontWeight: '700', color: colors.textPrimary,
        marginHorizontal: SPACING.md, marginTop: SPACING.lg, marginBottom: SPACING.sm,
    },
    card: {
        backgroundColor: colors.surface, marginHorizontal: SPACING.md,
        borderRadius: 20, padding: SPACING.md, ...SHADOWS.small,
    },
    emptyText: { color: colors.textLight, fontSize: 14, textAlign: 'center', paddingVertical: SPACING.sm },

    // Stock alerts
    alertRow: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm,
        borderBottomWidth: 1, borderColor: colors.border,
    },
    alertDot: {
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: colors.error, marginRight: SPACING.sm,
    },
    alertName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    alertStock: { fontSize: 12, color: colors.error, marginTop: 2 },
    alertBtn: {
        backgroundColor: colors.error + '22', borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 5,
    },
    alertBtnText: { color: colors.error, fontSize: 12, fontWeight: '700' },

    // Last calc
    lastCalcValue: { fontSize: 32, fontWeight: '800', color: colors.primary },
    lastCalcUnit: { fontSize: 16, color: colors.textSecondary, fontWeight: '400' },
    lastCalcDetail: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    lastCalcDate: { fontSize: 11, color: colors.textLight, marginTop: 2 },

    // Events
    eventRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm },
    eventRowBorder: { borderBottomWidth: 1, borderColor: colors.border },
    eventColorDot: { width: 12, height: 12, borderRadius: 6, marginRight: SPACING.sm },
    eventTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    eventDate: { fontSize: 12, color: colors.textLight, marginTop: 1 },
    eventBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
    eventBadgeText: { fontSize: 11, fontWeight: '700' },

    viewAllBtn: {
        marginTop: SPACING.sm, alignItems: 'center',
        paddingVertical: SPACING.sm,
        borderTopWidth: 1, borderColor: colors.border,
    },
    viewAllText: { color: colors.primary, fontWeight: '700', fontSize: 13 },

    // Quick actions
    quickRow: {
        flexDirection: 'row', marginHorizontal: SPACING.md, gap: SPACING.sm,
    },
    quickBtn: {
        flex: 1, borderRadius: 16, paddingVertical: SPACING.md,
        alignItems: 'center', ...SHADOWS.small,
    },
    quickEmoji: { fontSize: 28, marginBottom: 4 },
    quickLabel: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
