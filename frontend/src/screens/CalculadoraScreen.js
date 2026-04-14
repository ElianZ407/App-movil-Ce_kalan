import React, { useState, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView,
    Platform, StatusBar, Modal, FlatList,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { ENDPOINTS } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { validateCalculadora } from '../utils/validation';
import { getErrorMessage, logError } from '../utils/errorHandler';

export default function CalculadoraScreen() {
    const [ancho, setAncho] = useState('');
    const [largo, setLargo] = useState('');
    const [dosis, setDosis] = useState('');
    const [resultado, setResultado] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [compartiendo, setCompartiendo] = useState(false);
    const [historial, setHistorial] = useState([]);
    const [cargandoHistorial, setCargandoHistorial] = useState(false);
    const { t } = useLanguage();
    const { colors } = useTheme();

    // ── Estado de plaguicida y unidad ──
    const [plaguicidas, setPlaguicidas] = useState([]);
    const [plaguicidaSeleccionado, setPlaguicidaSeleccionado] = useState(null);
    const [unidad, setUnidad] = useState('L'); // 'L' o 'mL'
    const [mostrarPickerPlaguicida, setMostrarPickerPlaguicida] = useState(false);

    // ── Cargar plaguicidas disponibles ──
    const cargarPlaguicidas = useCallback(async () => {
        try {
            const res = await axios.get(ENDPOINTS.PLAGUICIDAS);
            setPlaguicidas(res.data.data || []);
        } catch (e) {
            logError('CalculadoraScreen.cargarPlaguicidas', e);
        }
    }, []);

    const cargarHistorial = useCallback(async () => {
        setCargandoHistorial(true);
        try {
            const res = await axios.get(ENDPOINTS.CALCULOS);
            setHistorial(res.data.data || []);
        } catch (e) {
            logError('CalculadoraScreen.cargarHistorial', e);
        } finally {
            setCargandoHistorial(false);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        cargarHistorial();
        cargarPlaguicidas();
    }, [cargarHistorial, cargarPlaguicidas]));

    const calcular = async () => {
        // Validar entradas con el utilitario de seguridad
        const { valid, error } = validateCalculadora(ancho, largo, dosis);
        if (!valid) {
            Alert.alert(t.error, error);
            return;
        }

        // Validar que se haya seleccionado un plaguicida
        if (!plaguicidaSeleccionado) {
            Alert.alert(t.error, t.selectPesticideRequired || 'Selecciona un plaguicida.');
            return;
        }

        const a = parseFloat(ancho);
        const l = parseFloat(largo);
        const d = parseFloat(dosis);
        const area = a * l;
        const res = (area * d) / 10000;

        // Convertir a litros para mostrar stock
        const resultadoEnLitros = unidad === 'mL' ? res / 1000 : res;

        setResultado({
            area,
            resultado: res,
            resultadoEnLitros,
            ancho: a,
            largo: l,
            dosis: d,
            plaguicida: plaguicidaSeleccionado,
            unidad,
        });

        setCargando(true);
        try {
            const response = await axios.post(ENDPOINTS.CALCULOS, {
                ancho: a,
                largo: l,
                dosis: d,
                plaguicida_id: plaguicidaSeleccionado.id,
                unidad,
            });

            let mensajeExito = t.calculationSaved;

            // Mostrar info de stock si se descontó
            if (response.data.stockInfo) {
                const info = response.data.stockInfo;
                mensajeExito += `\n\n📦 ${info.plaguicida}:\n`;
                mensajeExito += `  Descontado: ${info.descontado.toFixed(4)} L\n`;
                mensajeExito += `  Stock restante: ${info.stockRestante.toFixed(2)} L`;
                if (info.alertaBajoStock) {
                    mensajeExito += '\n\n⚠️ ¡Stock bajo!';
                }
            }

            Alert.alert(t.success, mensajeExito);
            cargarHistorial();
            cargarPlaguicidas(); // Recargar para ver stock actualizado
        } catch (err) {
            logError('CalculadoraScreen.calcular', err);
            Alert.alert(t.error, getErrorMessage(err, 'No se pudo guardar el cálculo.'));
        } finally {
            setCargando(false);
        }
    };

    const compartirResultado = async () => {
        if (!resultado) return;
        setCompartiendo(true);
        try {
            const fecha = new Date().toLocaleDateString('es-MX', {
                day: '2-digit', month: 'long', year: 'numeric',
            });
            const unidadLabel = resultado.unidad === 'mL' ? 'mL' : 'L';
            const plaguicidaNombre = resultado.plaguicida?.nombre || 'No especificado';
            const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #1B2A1E; }
    h1 { color: #1B5E20; font-size: 28px; margin-bottom: 4px; }
    .subtitle { color: #78909C; font-size: 14px; margin-bottom: 32px; }
    .result-box { background: #1B5E20; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px; }
    .result-value { font-size: 48px; font-weight: bold; color: #FFA000; }
    .result-label { color: rgba(255,255,255,0.8); font-size: 16px; margin-top: 4px; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .detail-card { background: #F1F8E9; border-radius: 12px; padding: 16px; text-align: center; }
    .detail-value { font-size: 22px; font-weight: bold; color: #2E7D32; }
    .detail-label { font-size: 12px; color: #4A694D; margin-top: 4px; }
    .footer { color: #78909C; font-size: 12px; text-align: center; margin-top: 32px; border-top: 1px solid #C8E6C9; padding-top: 16px; }
    .area-box { background: #E8F5E9; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
    .area-label { font-size: 13px; color: #4A694D; }
    .area-value { font-size: 20px; font-weight: bold; color: #2E7D32; }
    .pesticide-box { background: #FFF3E0; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
    .pesticide-label { font-size: 13px; color: #E65100; }
    .pesticide-value { font-size: 18px; font-weight: bold; color: #FF6F00; }
  </style>
</head>
<body>
  <h1>🌿 Ce-Kalan</h1>
  <p class="subtitle">Reporte de Cálculo de Dosis Agrícola — ${fecha}</p>
  <div class="pesticide-box">
    <div class="pesticide-label">Plaguicida utilizado</div>
    <div class="pesticide-value">🧴 ${plaguicidaNombre}</div>
  </div>
  <div class="result-box">
    <div class="result-value">${resultado.resultado.toFixed(4)} ${unidadLabel}</div>
    <div class="result-label">${unidadLabel === 'mL' ? 'Mililitros' : 'Litros'} de producto necesarios</div>
  </div>
  <div class="detail-grid">
    <div class="detail-card">
      <div class="detail-value">${resultado.ancho} m</div>
      <div class="detail-label">Ancho</div>
    </div>
    <div class="detail-card">
      <div class="detail-value">${resultado.largo} m</div>
      <div class="detail-label">Largo</div>
    </div>
    <div class="detail-card">
      <div class="detail-value">${resultado.dosis} ${unidadLabel}/ha</div>
      <div class="detail-label">Dosis</div>
    </div>
  </div>
  <div class="area-box">
    <div class="area-label">Superficie total</div>
    <div class="area-value">${resultado.area.toFixed(2)} m² = ${(resultado.area / 10000).toFixed(4)} ha</div>
  </div>
  <div class="footer">Generado por Ce-Kalan • Gestión agrícola inteligente</div>
</body>
</html>`;

            const { uri } = await Print.printToFileAsync({ html, base64: false });
            const disponible = await Sharing.isAvailableAsync();
            if (disponible) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Compartir cálculo',
                    UTI: 'com.adobe.pdf',
                });
            } else {
                Alert.alert(t.error, 'El dispositivo no soporta la función de compartir.');
            }
        } catch (err) {
            logError('CalculadoraScreen.compartir', err);
            Alert.alert(t.error, 'No se pudo generar el reporte.');
        } finally {
            setCompartiendo(false);
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

    const getStockColor = (stock) => {
        if (stock === null || stock === undefined) return COLORS.textLight;
        const s = parseFloat(stock);
        if (s <= 0) return '#D32F2F';
        if (s < 5) return '#FF6F00';
        return '#2E7D32';
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
                    {/* ── Selector de plaguicida ── */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>🧴 {t.pesticideName || 'Plaguicida'}</Text>
                        <TouchableOpacity
                            style={styles.pickerBtn}
                            onPress={() => setMostrarPickerPlaguicida(true)}
                        >
                            <Text style={[
                                styles.pickerBtnText,
                                !plaguicidaSeleccionado && { color: COLORS.textLight }
                            ]}>
                                {plaguicidaSeleccionado
                                    ? `${plaguicidaSeleccionado.nombre} (${plaguicidaSeleccionado.tipo})`
                                    : (t.selectPesticide || 'Seleccionar plaguicida...')
                                }
                            </Text>
                            {plaguicidaSeleccionado && plaguicidaSeleccionado.stock !== null && (
                                <Text style={[
                                    styles.pickerStockBadge,
                                    { color: getStockColor(plaguicidaSeleccionado.stock) }
                                ]}>
                                    📦 {parseFloat(plaguicidaSeleccionado.stock).toFixed(2)} L
                                </Text>
                            )}
                            <Text style={styles.pickerArrow}>▼</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── Selector de unidad ── */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>📏 {t.doseUnit || 'Unidad de dosis'}</Text>
                        <View style={styles.unitRow}>
                            <TouchableOpacity
                                style={[styles.unitBtn, unidad === 'L' && styles.unitBtnActive]}
                                onPress={() => setUnidad('L')}
                            >
                                <Text style={[styles.unitBtnText, unidad === 'L' && styles.unitBtnTextActive]}>
                                    L/ha (Litros)
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.unitBtn, unidad === 'mL' && styles.unitBtnActive]}
                                onPress={() => setUnidad('mL')}
                            >
                                <Text style={[styles.unitBtnText, unidad === 'mL' && styles.unitBtnTextActive]}>
                                    mL/ha (Mililitros)
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

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
                        <Text style={styles.label}>{t.dose} ({unidad}/ha)</Text>
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
                            <Text style={styles.resultUnit}> {resultado.unidad === 'mL' ? 'mL' : t.resultUnit}</Text>
                        </Text>
                        {resultado.plaguicida && (
                            <Text style={styles.resultPesticide}>
                                🧴 {resultado.plaguicida.nombre}
                            </Text>
                        )}
                        <View style={styles.resultDetail}>
                            <Text style={styles.resultDetailText}>
                                {t.area}: {resultado.area.toFixed(2)} m²
                                {'  '}({(resultado.area / 10000).toFixed(4)} {t.hectares})
                            </Text>
                        </View>
                        {/* Botón compartir */}
                        <TouchableOpacity
                            style={styles.shareBtn}
                            onPress={compartirResultado}
                            disabled={compartiendo}
                        >
                            {compartiendo
                                ? <ActivityIndicator color="#fff" size="small" />
                                : <Text style={styles.shareBtnText}>📄 {t.shareCalc}</Text>
                            }
                        </TouchableOpacity>
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
                                <Text style={styles.historyResult}>
                                    {parseFloat(item.resultado).toFixed(4)} {item.unidad || 'L'}
                                </Text>
                                <Text style={styles.historyDetail}>
                                    {item.ancho}m × {item.largo}m • {item.dosis} {item.unidad || 'L'}/ha
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

            {/* ── Modal Picker de Plaguicidas ── */}
            <Modal
                visible={mostrarPickerPlaguicida}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setMostrarPickerPlaguicida(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                🧴 {t.selectPesticide || 'Seleccionar Plaguicida'}
                            </Text>
                            <TouchableOpacity onPress={() => setMostrarPickerPlaguicida(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {plaguicidas.length === 0 ? (
                            <View style={{ padding: SPACING.xl, alignItems: 'center' }}>
                                <Text style={{ fontSize: 40, marginBottom: SPACING.sm }}>🧴</Text>
                                <Text style={{ color: COLORS.textLight, textAlign: 'center' }}>
                                    {t.noPesticides}
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={plaguicidas}
                                keyExtractor={(item) => String(item.id)}
                                renderItem={({ item }) => {
                                    const isSelected = plaguicidaSeleccionado?.id === item.id;
                                    const stock = item.stock !== null ? parseFloat(item.stock) : null;
                                    return (
                                        <TouchableOpacity
                                            style={[
                                                styles.modalItem,
                                                isSelected && styles.modalItemSelected,
                                            ]}
                                            onPress={() => {
                                                setPlaguicidaSeleccionado(item);
                                                setMostrarPickerPlaguicida(false);
                                            }}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text style={[
                                                    styles.modalItemName,
                                                    isSelected && { color: COLORS.primary }
                                                ]}>
                                                    {item.nombre}
                                                </Text>
                                                <Text style={styles.modalItemType}>
                                                    {item.tipo}
                                                </Text>
                                            </View>
                                            {stock !== null && (
                                                <View style={[
                                                    styles.modalStockBadge,
                                                    { backgroundColor: stock <= 0 ? '#FFEBEE' : stock < 5 ? '#FFF3E0' : '#E8F5E9' }
                                                ]}>
                                                    <Text style={[
                                                        styles.modalStockText,
                                                        { color: getStockColor(stock) }
                                                    ]}>
                                                        {stock.toFixed(2)} L
                                                    </Text>
                                                </View>
                                            )}
                                            {isSelected && <Text style={styles.modalCheck}>✓</Text>}
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        )}
                    </View>
                </View>
            </Modal>
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

    // ── Picker de plaguicida ──
    pickerBtn: {
        backgroundColor: COLORS.surfaceGray, borderRadius: 12,
        paddingHorizontal: SPACING.md, paddingVertical: 14,
        borderWidth: 1.5, borderColor: COLORS.border,
        flexDirection: 'row', alignItems: 'center',
    },
    pickerBtnText: {
        flex: 1, fontSize: 15, color: COLORS.textPrimary,
    },
    pickerStockBadge: {
        fontSize: 12, fontWeight: '700', marginRight: SPACING.xs,
    },
    pickerArrow: {
        fontSize: 12, color: COLORS.textLight,
    },

    // ── Selector de unidad ──
    unitRow: {
        flexDirection: 'row', gap: SPACING.sm,
    },
    unitBtn: {
        flex: 1, borderRadius: 12, paddingVertical: 12,
        alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border,
        backgroundColor: COLORS.surfaceGray,
    },
    unitBtnActive: {
        backgroundColor: COLORS.primary, borderColor: COLORS.primary,
    },
    unitBtnText: {
        fontSize: 13, fontWeight: '600', color: COLORS.textSecondary,
    },
    unitBtnTextActive: {
        color: '#fff',
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
    resultPesticide: {
        fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '600',
        marginTop: 4,
    },
    resultDetail: { marginTop: SPACING.sm },
    resultDetailText: { color: 'rgba(255,255,255,0.65)', fontSize: 13 },
    shareBtn: {
        backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10,
        paddingVertical: 10, alignItems: 'center', marginTop: SPACING.sm,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    },
    shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
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

    // ── Modal de plaguicidas ──
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        maxHeight: '70%', paddingBottom: SPACING.xl,
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: SPACING.md, borderBottomWidth: 1, borderColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 18, fontWeight: '700', color: COLORS.textPrimary,
    },
    modalClose: {
        fontSize: 22, color: COLORS.textLight, padding: SPACING.xs,
    },
    modalItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: SPACING.md, paddingHorizontal: SPACING.md,
        borderBottomWidth: 1, borderColor: COLORS.border,
    },
    modalItemSelected: {
        backgroundColor: '#E8F5E9',
    },
    modalItemName: {
        fontSize: 15, fontWeight: '700', color: COLORS.textPrimary,
    },
    modalItemType: {
        fontSize: 12, color: COLORS.textLight, marginTop: 2,
    },
    modalStockBadge: {
        borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
        marginRight: SPACING.sm,
    },
    modalStockText: {
        fontSize: 12, fontWeight: '700',
    },
    modalCheck: {
        fontSize: 18, color: COLORS.primary, fontWeight: '700',
    },
});
