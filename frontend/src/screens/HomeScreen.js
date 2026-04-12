import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import axios from 'axios';
import * as Location from 'expo-location';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { SPACING, SHADOWS } from '../constants/theme';
import { logError } from '../utils/errorHandler';

// ============================================================
// Helpers de clima — Open-Meteo (sin API key)
// ============================================================

/**
 * Devuelve emoji + clave de traducción según WMO weather code
 * https://open-meteo.com/en/docs#weathervariables
 */
const getWeatherInfo = (code) => {
    if (code <= 1) return { emoji: '☀️', key: 'weatherClear' };
    if (code <= 3) return { emoji: '⛅', key: 'weatherPartlyCloudy' };
    if (code <= 48) return { emoji: '☁️', key: 'weatherCloudy' };
    if (code <= 57) return { emoji: '🌧️', key: 'weatherDrizzle' };
    if (code <= 67) return { emoji: '🌧️', key: 'weatherRain' };
    if (code <= 77) return { emoji: '❄️', key: 'weatherSnow' };
    if (code <= 82) return { emoji: '🌧️', key: 'weatherRain' };
    if (code <= 86) return { emoji: '❄️', key: 'weatherSnow' };
    return { emoji: '⛈️', key: 'weatherThunderstorm' };
};

/**
 * Evalúa si las condiciones son buenas para aplicar plaguicida:
 *  - Sin lluvia (code < 50)
 *  - Viento < 15 km/h
 *  - Temp entre 10°C y 35°C
 */
const isGoodForSpraying = (code, windSpeed, temp) => {
    if (code >= 50) return false;   // lluvia/nieve
    if (windSpeed > 15) return false; // mucho viento
    if (temp < 10 || temp > 35) return false; // extremos
    return true;
};

const fetchWeather = async (latitude, longitude) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;
    const res = await axios.get(url, { timeout: 8000 });
    return res.data.current;
};

// ============================================================
// Componente principal
// ============================================================

export default function HomeScreen() {
    const [stats, setStats] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const { usuario, esAdmin } = useAuth();
    const { t } = useLanguage();
    const { colors } = useTheme();
    const navigation = useNavigation();

    // ── Weather state ──
    const [weather, setWeather] = useState(null);
    const [weatherLoading, setWeatherLoading] = useState(true);
    const [weatherError, setWeatherError] = useState(null);

    // ── Cargar estadísticas ──
    const cargarStats = useCallback(async () => {
        setError(false);
        try {
            const res = await axios.get(ENDPOINTS.STATS);
            setStats(res.data.data);
        } catch (e) {
            logError('HomeScreen.cargarStats', e);
            setError(true);
        } finally {
            setCargando(false);
            setRefreshing(false);
        }
    }, []);

    // ── Cargar clima ──
    const cargarClima = useCallback(async () => {
        setWeatherLoading(true);
        setWeatherError(null);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setWeatherError('locationDenied');
                setWeatherLoading(false);
                return;
            }

            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            const data = await fetchWeather(loc.coords.latitude, loc.coords.longitude);
            setWeather(data);
        } catch (e) {
            logError('HomeScreen.cargarClima', e);
            setWeatherError('generic');
        } finally {
            setWeatherLoading(false);
        }
    }, []);

    // ── Focus effect ──
    useFocusEffect(useCallback(() => {
        setCargando(true);
        setError(false);
        cargarStats();
    }, [cargarStats]));

    // Clima solo al montar (no en cada focus para no gastar batería)
    useEffect(() => {
        cargarClima();
    }, [cargarClima]);

    const onRefresh = () => {
        setRefreshing(true);
        cargarStats();
        cargarClima();
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

    // ── Weather card renderer ──
    const renderWeatherCard = () => {
        if (weatherLoading) {
            return (
                <View style={s.weatherCard}>
                    <ActivityIndicator color={colors.secondary} size="small" />
                    <Text style={s.weatherLoadingText}>{t.weatherLoading}</Text>
                </View>
            );
        }

        if (weatherError) {
            return (
                <View style={s.weatherCard}>
                    <Text style={s.weatherErrorEmoji}>🌐</Text>
                    <Text style={s.weatherErrorText}>
                        {weatherError === 'locationDenied' ? t.weatherLocationDenied : t.weatherError}
                    </Text>
                    <TouchableOpacity style={s.weatherRetryBtn} onPress={cargarClima}>
                        <Text style={s.weatherRetryText}>🔄</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (!weather) return null;

        const info = getWeatherInfo(weather.weather_code);
        const temp = Math.round(weather.temperature_2m);
        const feelsLike = Math.round(weather.apparent_temperature);
        const humidity = weather.relative_humidity_2m;
        const wind = Math.round(weather.wind_speed_10m);
        const goodConditions = isGoodForSpraying(weather.weather_code, wind, temp);

        return (
            <View style={s.weatherCard}>
                {/* Fila principal */}
                <View style={s.weatherMainRow}>
                    <View style={s.weatherLeft}>
                        <Text style={s.weatherEmoji}>{info.emoji}</Text>
                        <View>
                            <Text style={s.weatherTemp}>{temp}°C</Text>
                            <Text style={s.weatherCondition}>{t[info.key]}</Text>
                        </View>
                    </View>
                    <View style={s.weatherRight}>
                        <Text style={s.weatherDetail}>
                            {t.weatherFeelsLike}: {feelsLike}°C
                        </Text>
                        <Text style={s.weatherDetail}>
                            💧 {humidity}%  •  💨 {wind} km/h
                        </Text>
                    </View>
                </View>

                {/* Indicador agrícola */}
                <View style={[
                    s.weatherAgriRow,
                    { backgroundColor: goodConditions ? '#E8F5E9' : '#FFF3E0' }
                ]}>
                    <Text style={[
                        s.weatherAgriText,
                        { color: goodConditions ? '#2E7D32' : '#E65100' }
                    ]}>
                        {goodConditions ? t.weatherGoodConditions : t.weatherBadConditions}
                    </Text>
                </View>
            </View>
        );
    };

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

                {/* ── Tarjeta de clima ── */}
                <Text style={s.sectionTitle}>🌤️ {t.weather}</Text>
                {renderWeatherCard()}

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

    // ── Weather card styles ──
    weatherCard: {
        backgroundColor: colors.surface,
        marginHorizontal: SPACING.md,
        borderRadius: 20,
        padding: SPACING.md,
        ...SHADOWS.small,
        minHeight: 80,
        justifyContent: 'center',
    },
    weatherMainRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    weatherLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    weatherRight: {
        alignItems: 'flex-end',
    },
    weatherEmoji: {
        fontSize: 44,
    },
    weatherTemp: {
        fontSize: 30,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    weatherCondition: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    weatherDetail: {
        fontSize: 12,
        color: colors.textLight,
        marginTop: 2,
    },
    weatherAgriRow: {
        marginTop: SPACING.sm,
        borderRadius: 12,
        paddingVertical: 6,
        paddingHorizontal: SPACING.sm,
        alignItems: 'center',
    },
    weatherAgriText: {
        fontSize: 13,
        fontWeight: '700',
    },
    weatherLoadingText: {
        color: colors.textLight,
        fontSize: 13,
        textAlign: 'center',
        marginTop: SPACING.xs,
    },
    weatherErrorEmoji: {
        fontSize: 28,
        textAlign: 'center',
    },
    weatherErrorText: {
        color: colors.textLight,
        fontSize: 13,
        textAlign: 'center',
        marginTop: 4,
    },
    weatherRetryBtn: {
        alignSelf: 'center',
        marginTop: SPACING.xs,
    },
    weatherRetryText: {
        fontSize: 20,
    },

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
