import React, { useState, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, ScrollView, Modal, ActivityIndicator,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { ENDPOINTS } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { validateEvento, limitAndSanitize } from '../utils/validation';
import { getErrorMessage, logError } from '../utils/errorHandler';

// Configuración de locale en español
LocaleConfig.locales['es'] = {
    monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    today: 'Hoy',
};
LocaleConfig.defaultLocale = 'es';

const COLORS_EVENTS = ['#2E7D32', '#FFA000', '#1565C0', '#AD1457', '#37474F', '#6A1B9A'];

export default function CalendarioScreen() {
    const [eventos, setEventos] = useState([]);
    const [diaSeleccionado, setDiaSeleccionado] = useState('');
    const [eventosDelDia, setEventosDelDia] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [colorSeleccionado, setColorSeleccionado] = useState(COLORS_EVENTS[0]);
    const [guardando, setGuardando] = useState(false);
    const [cargando, setCargando] = useState(false);
    const { t } = useLanguage();

    const cargarEventos = useCallback(async () => {
        setCargando(true);
        try {
            const res = await axios.get(ENDPOINTS.EVENTOS);
            setEventos(res.data.data || []);
        } catch (e) {
            logError('CalendarioScreen.cargarEventos', e);
        } finally {
            setCargando(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { cargarEventos(); }, [cargarEventos]));

    // Construir el objeto de fechas marcadas para el calendario
    const markedDates = {};
    eventos.forEach((ev) => {
        const fecha = ev.fecha.substring(0, 10); // YYYY-MM-DD
        if (!markedDates[fecha]) {
            markedDates[fecha] = { dots: [], marked: true };
        }
        markedDates[fecha].dots.push({ color: ev.color || COLORS.primary });
    });

    if (diaSeleccionado) {
        markedDates[diaSeleccionado] = {
            ...(markedDates[diaSeleccionado] || {}),
            selected: true,
            selectedColor: COLORS.primary,
            dots: markedDates[diaSeleccionado]?.dots || [],
        };
    }

    const onDiaPress = (day) => {
        setDiaSeleccionado(day.dateString);
        const evs = eventos.filter((ev) => ev.fecha.substring(0, 10) === day.dateString);
        setEventosDelDia(evs);
    };

    const guardarEvento = async () => {
        // Sanitizar y validar entradas
        const tituloSanitizado = limitAndSanitize(titulo, 200);
        const descripcionSanitizada = limitAndSanitize(descripcion, 500);

        const { valid, error } = validateEvento(tituloSanitizado, diaSeleccionado);
        if (!valid) {
            Alert.alert(t.error, error);
            return;
        }
        setGuardando(true);
        try {
            await axios.post(ENDPOINTS.EVENTOS, {
                titulo: tituloSanitizado,
                descripcion: descripcionSanitizada,
                fecha: diaSeleccionado,
                color: colorSeleccionado,
            });
            Alert.alert(t.success, 'Evento guardado.');
            setTitulo('');
            setDescripcion('');
            setModalVisible(false);
            await cargarEventos();
            const evs = eventos.filter((ev) => ev.fecha.substring(0, 10) === diaSeleccionado);
            setEventosDelDia(evs);
        } catch (error) {
            logError('CalendarioScreen.guardarEvento', error);
            Alert.alert(t.error, getErrorMessage(error, 'No se pudo guardar el evento.'));
        } finally {
            setGuardando(false);
        }
    };

    const eliminarEvento = (id) => {
        Alert.alert('Eliminar', '¿Deseas eliminar este evento?', [
            { text: t.cancel, style: 'cancel' },
            {
                text: t.delete, style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${ENDPOINTS.EVENTOS}/${id}`);
                        await cargarEventos();
                        setEventosDelDia((prev) => prev.filter((e) => e.id !== id));
                    } catch (e) {
                        logError('CalendarioScreen.eliminarEvento', e);
                        Alert.alert(t.error, getErrorMessage(e, 'No se pudo eliminar el evento.'));
                    }
                },
            },
        ]);
    };

    const hoyStr = new Date().toISOString().substring(0, 10);

    return (
        <View style={styles.container}>
            <View style={styles.headerBg}>
                <Text style={styles.headerEmoji}>📅</Text>
                <Text style={styles.headerTitle}>{t.calendarTitle}</Text>
            </View>

            <ScrollView>
                <Calendar
                    current={hoyStr}
                    onDayPress={onDiaPress}
                    markingType="multi-dot"
                    markedDates={markedDates}
                    theme={{
                        backgroundColor: COLORS.surface,
                        calendarBackground: COLORS.surface,
                        textSectionTitleColor: COLORS.primary,
                        selectedDayBackgroundColor: COLORS.primary,
                        selectedDayTextColor: '#ffffff',
                        todayTextColor: COLORS.secondary,
                        dayTextColor: COLORS.textPrimary,
                        textDisabledColor: COLORS.textLight,
                        arrowColor: COLORS.primary,
                        monthTextColor: COLORS.primaryDark,
                        indicatorColor: COLORS.primary,
                        textDayFontWeight: '500',
                        textMonthFontWeight: '800',
                        textDayHeaderFontWeight: '700',
                    }}
                    style={styles.calendar}
                />

                {/* Botón agregar evento */}
                {diaSeleccionado && (
                    <View style={styles.selectedDayContainer}>
                        <Text style={styles.selectedDayTitle}>
                            {t.eventsFor} {diaSeleccionado}
                        </Text>
                        <TouchableOpacity
                            style={styles.addEventBtn}
                            onPress={() => setModalVisible(true)}
                        >
                            <Text style={styles.addEventBtnText}>+ {t.addEvent}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Eventos del día seleccionado */}
                {diaSeleccionado && (
                    <View style={styles.eventList}>
                        {eventosDelDia.length === 0 ? (
                            <View style={styles.noEventsCard}>
                                <Text style={styles.noEventsText}>{t.noEvents}</Text>
                            </View>
                        ) : (
                            eventosDelDia.map((ev) => (
                                <View key={ev.id} style={[styles.eventCard, { borderLeftColor: ev.color || COLORS.primary }]}>
                                    <View style={styles.eventBody}>
                                        <Text style={styles.eventTitle}>{ev.titulo}</Text>
                                        {ev.descripcion ? (
                                            <Text style={styles.eventDesc}>{ev.descripcion}</Text>
                                        ) : null}
                                    </View>
                                    <TouchableOpacity
                                        style={styles.eventDeleteBtn}
                                        onPress={() => eliminarEvento(ev.id)}
                                    >
                                        <Text>🗑️</Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Modal para nuevo evento */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{t.addEvent}</Text>
                        <Text style={styles.modalDate}>📅 {diaSeleccionado}</Text>

                        <Text style={styles.label}>{t.eventTitle}</Text>
                        <TextInput
                            style={styles.input}
                            value={titulo}
                            onChangeText={setTitulo}
                            placeholder="Ej: Aplicar fumigación"
                            placeholderTextColor={COLORS.textLight}
                            maxLength={200}
                        />

                        <Text style={styles.label}>{t.eventDescription}</Text>
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                            value={descripcion}
                            onChangeText={setDescripcion}
                            placeholder="Detalles del evento..."
                            placeholderTextColor={COLORS.textLight}
                            multiline
                            maxLength={500}
                        />

                        <Text style={styles.label}>Color del evento</Text>
                        <View style={styles.colorRow}>
                            {COLORS_EVENTS.map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    style={[
                                        styles.colorDot,
                                        { backgroundColor: c },
                                        colorSeleccionado === c && styles.colorDotSelected,
                                    ]}
                                    onPress={() => setColorSeleccionado(c)}
                                />
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveBtn, guardando && { opacity: 0.6 }]}
                                onPress={guardarEvento}
                                disabled={guardando}
                            >
                                {guardando
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={styles.saveBtnText}>{t.save}</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    headerBg: {
        backgroundColor: COLORS.primaryDark, paddingVertical: SPACING.xl,
        alignItems: 'center', paddingTop: SPACING.xxl,
    },
    headerEmoji: { fontSize: 36, marginBottom: 4 },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
    calendar: { margin: SPACING.md, borderRadius: 16, ...SHADOWS.medium, overflow: 'hidden' },
    selectedDayContainer: {
        marginHorizontal: SPACING.md, marginTop: SPACING.sm,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    selectedDayTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
    addEventBtn: {
        backgroundColor: COLORS.secondary, borderRadius: 16,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, ...SHADOWS.small,
    },
    addEventBtnText: { color: COLORS.primaryDark, fontWeight: '700', fontSize: 13 },
    eventList: { marginHorizontal: SPACING.md, marginTop: SPACING.sm, paddingBottom: SPACING.xxl },
    noEventsCard: {
        backgroundColor: COLORS.surface, borderRadius: 16,
        padding: SPACING.md, alignItems: 'center', ...SHADOWS.small,
    },
    noEventsText: { color: COLORS.textLight, fontSize: 14 },
    eventCard: {
        backgroundColor: COLORS.surface, borderRadius: 16, marginBottom: SPACING.sm,
        flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
        borderLeftWidth: 5, ...SHADOWS.small,
    },
    eventBody: { flex: 1 },
    eventTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
    eventDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
    eventDeleteBtn: { padding: SPACING.sm },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalCard: {
        backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: SPACING.lg, paddingBottom: SPACING.xxl,
    },
    modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
    modalDate: { color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.md },
    label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, marginTop: SPACING.sm },
    input: {
        backgroundColor: COLORS.surfaceGray, borderRadius: 12,
        paddingHorizontal: SPACING.md, paddingVertical: 13,
        fontSize: 15, color: COLORS.textPrimary,
        borderWidth: 1.5, borderColor: COLORS.border,
    },
    colorRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
    colorDot: { width: 32, height: 32, borderRadius: 16 },
    colorDotSelected: { borderWidth: 3, borderColor: COLORS.textPrimary, transform: [{ scale: 1.2 }] },
    modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
    cancelBtn: {
        flex: 1, backgroundColor: COLORS.surfaceGray, borderRadius: 14,
        paddingVertical: 14, alignItems: 'center',
    },
    cancelBtnText: { color: COLORS.textSecondary, fontWeight: '600' },
    saveBtn: {
        flex: 1, backgroundColor: COLORS.primary, borderRadius: 14,
        paddingVertical: 14, alignItems: 'center', ...SHADOWS.medium,
    },
    saveBtnText: { color: '#fff', fontWeight: '700' },
});
