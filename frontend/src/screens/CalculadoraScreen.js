import React, { useState, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView,
    Platform,
} from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { ENDPOINTS } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { validateCalculadora } from '../utils/validation';
import { getErrorMessage, logError } from '../utils/errorHandler';

export default function CalculadoraScreen() {
    const [ancho, setAncho] = useState('');
    const [largo, setLargo] = useState('');
    const [dosis, setDosis] = useState('');
    const [resultado, setResultado] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [historial, setHistorial] = useState([]);
    const [cargandoHistorial, setCargandoHistorial] = useState(false);
    const { t } = useLanguage();

    const cargarHistorial = useCallback(async () => {
        setCargandoHistorial(true);
        try {
            const res = await axios.get(ENDPOINTS.CALCULOS);
            setHistorial(res.data.data || []);
        } catch (e) {
            logError('CalculadoraScreen.cargarHistorial', e);
            // No mostramos error al usuario aquí para no interrumpir la experiencia
        } finally {
            setCargandoHistorial(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { cargarHistorial(); }, [cargarHistorial]));

    const calcular = async () => {
        // Validar entradas con el utilitario de seguridad
        const { valid, error } = validateCalculadora(ancho, largo, dosis);
        if (!valid) {
            Alert.alert(t.error, error);
            return;
        }

        const a = parseFloat(ancho);
        const l = parseFloat(largo);
        const d = parseFloat(dosis);
        const area = a * l;
        const res = (area * d) / 10000;
        setResultado({ area, resultado: res });

        setCargando(true);
        try {
            await axios.post(ENDPOINTS.CALCULOS, { ancho: a, largo: l, dosis: d });
            Alert.alert(t.success, t.calculationSaved);
            cargarHistorial();
        } catch (error) {
            logError('CalculadoraScreen.calcular', error);
            Alert.alert(t.error, getErrorMessage(error, 'No se pudo guardar el cálculo.'));
        } finally {
            setCargando(false);
        }
    };

    const eliminarCalculo = async (id) => {
        Alert.alert('Eliminar', '¿Deseas eliminar este cálculo?', [
            { text: t.cancel, style: 'cancel' },
            {
                text: t.delete, style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${ENDPOINTS.CALCULOS}/${id}`);
                        cargarHistorial();
                    } catch (e) {
                        logError('CalculadoraScreen.eliminarCalculo', e);
                        Alert.alert(t.error, getErrorMessage(e, 'No se pudo eliminar el cálculo.'));
                    }
                },
            },
        ]);
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.headerBg}>
                    <Text style={styles.headerEmoji}>🧪</Text>
                    <Text style={styles.headerTitle}>{t.calculatorTitle}</Text>
                </View>

                {/* Formulario */}
                <View style={styles.card}>
                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
                            <Text style={styles.label}>{t.width}</Text>
                            <TextInput
                                style={styles.input}
                                value={ancho}
                                onChangeText={setAncho}
                                keyboardType="decimal-pad"
                                placeholder="0.00"
                                placeholderTextColor={COLORS.textLight}
                                maxLength={10}
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>{t.length}</Text>
                            <TextInput
                                style={styles.input}
                                value={largo}
                                onChangeText={setLargo}
                                keyboardType="decimal-pad"
                                placeholder="0.00"
                                placeholderTextColor={COLORS.textLight}
                                maxLength={10}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t.dose}</Text>
                        <TextInput
                            style={styles.input}
                            value={dosis}
                            onChangeText={setDosis}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor={COLORS.textLight}
                            maxLength={10}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, cargando && styles.buttonDisabled]}
                        onPress={calcular}
                        disabled={cargando}
                    >
                        {cargando
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.buttonText}>⚗️ {t.calculate}</Text>
                        }
                    </TouchableOpacity>
                </View>

                {/* Resultado */}
                {resultado && (
                    <View style={styles.resultCard}>
                        <View style={styles.resultHeader}>
                            <Text style={styles.resultEmoji}>✅</Text>
                            <Text style={styles.resultTitle}>{t.result}</Text>
                        </View>
                        <Text style={styles.resultValue}>
                            {resultado.resultado.toFixed(4)}
                            <Text style={styles.resultUnit}> {t.resultUnit}</Text>
                        </Text>
                        <View style={styles.resultDetail}>
                            <Text style={styles.resultDetailText}>
                                {t.area}: {resultado.area.toFixed(2)} m²
                                {'  '}({(resultado.area / 10000).toFixed(4)} {t.hectares})
                            </Text>
                        </View>
                    </View>
                )}

                {/* Historial */}
                <Text style={styles.sectionTitle}>📋 {t.historyTitle}</Text>
                {cargandoHistorial ? (
                    <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.md }} />
                ) : historial.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>📊 No hay cálculos guardados.</Text>
                    </View>
                ) : (
                    historial.map((item) => (
                        <View key={item.id} style={styles.historyItem}>
                            <View style={styles.historyLeft}>
                                <Text style={styles.historyResult}>{parseFloat(item.resultado).toFixed(4)} L</Text>
                                <Text style={styles.historyDetail}>
                                    {item.ancho}m × {item.largo}m • {item.dosis} L/ha
                                </Text>
                                <Text style={styles.historyDate}>{formatDate(item.fecha)}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.deleteBtn}
                                onPress={() => eliminarCalculo(item.id)}
                            >
                                <Text style={styles.deleteBtnText}>🗑️</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { paddingBottom: SPACING.xxl },
    headerBg: {
        backgroundColor: COLORS.primaryDark, paddingVertical: SPACING.xl,
        alignItems: 'center', paddingTop: SPACING.xxl,
    },
    headerEmoji: { fontSize: 40, marginBottom: SPACING.xs },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
    card: {
        backgroundColor: COLORS.surface, margin: SPACING.md,
        borderRadius: 20, padding: SPACING.md, ...SHADOWS.medium,
    },
    row: { flexDirection: 'row' },
    inputGroup: { marginBottom: SPACING.md },
    label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
    input: {
        backgroundColor: COLORS.surfaceGray, borderRadius: 12,
        paddingHorizontal: SPACING.md, paddingVertical: 13,
        fontSize: 15, color: COLORS.textPrimary,
        borderWidth: 1.5, borderColor: COLORS.border,
    },
    button: {
        backgroundColor: COLORS.primary, borderRadius: 14,
        paddingVertical: 15, alignItems: 'center', ...SHADOWS.medium,
    },
    buttonDisabled: { backgroundColor: COLORS.textLight },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    resultCard: {
        backgroundColor: COLORS.primaryDark, marginHorizontal: SPACING.md,
        borderRadius: 20, padding: SPACING.lg, ...SHADOWS.large, marginBottom: SPACING.md,
    },
    resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
    resultEmoji: { fontSize: 24, marginRight: SPACING.sm },
    resultTitle: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
    resultValue: { fontSize: 36, fontWeight: '800', color: COLORS.secondary },
    resultUnit: { fontSize: 16, fontWeight: '400', color: 'rgba(255,255,255,0.7)' },
    resultDetail: { marginTop: SPACING.sm },
    resultDetailText: { color: 'rgba(255,255,255,0.65)', fontSize: 13 },
    sectionTitle: {
        fontSize: 17, fontWeight: '700', color: COLORS.textPrimary,
        marginHorizontal: SPACING.md, marginTop: SPACING.sm, marginBottom: SPACING.sm,
    },
    emptyCard: {
        backgroundColor: COLORS.surface, marginHorizontal: SPACING.md,
        borderRadius: 16, padding: SPACING.lg, alignItems: 'center',
    },
    emptyText: { color: COLORS.textLight, fontSize: 14 },
    historyItem: {
        backgroundColor: COLORS.surface, marginHorizontal: SPACING.md,
        marginBottom: SPACING.sm, borderRadius: 16, padding: SPACING.md,
        flexDirection: 'row', alignItems: 'center', ...SHADOWS.small,
        borderLeftWidth: 4, borderLeftColor: COLORS.primary,
    },
    historyLeft: { flex: 1 },
    historyResult: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
    historyDetail: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
    historyDate: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
    deleteBtn: { padding: SPACING.sm },
    deleteBtnText: { fontSize: 20 },
});
