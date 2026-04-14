import React, { useState, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, ScrollView, Modal, ActivityIndicator,
    KeyboardAvoidingView, Platform, Keyboard,
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
    const [cargando, setCargando] = useState(false);
    const { t } = useLanguage();

    // ── Modal de crear ──
    const [modalVisible, setModalVisible] = useState(false);
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [colorSeleccionado, setColorSeleccionado] = useState(COLORS_EVENTS[0]);
    const [guardando, setGuardando] = useState(false);

    // ── Modal de editar ──
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [eventoEditando, setEventoEditando] = useState(null);
    const [editTitulo, setEditTitulo] = useState('');
    const [editDescripcion, setEditDescripcion] = useState('');
    const [editColor, setEditColor] = useState(COLORS_EVENTS[0]);
    const [editFecha, setEditFecha] = useState('');
    const [mostrarCalendarioEdit, setMostrarCalendarioEdit] = useState(false);
    const [editGuardando, setEditGuardando] = useState(false);

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

    // ── Helpers ──
    const hoyStr = new Date().toISOString().substring(0, 10);

    const formatDateShort = (dateStr) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
    };

    const formatDateFull = (dateStr) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const getDaysUntil = (dateStr) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(dateStr + 'T00:00:00');
        const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Hoy';
        if (diff === 1) return 'Mañana';
        if (diff < 0) return `Hace ${Math.abs(diff)} días`;
        return `En ${diff} días`;
    };

    // ── Eventos filtrados ──
    const eventosDelDia = diaSeleccionado
        ? eventos.filter((ev) => ev.fecha.substring(0, 10) === diaSeleccionado)
        : [];

    const proximosEventos = eventos
        .filter((ev) => ev.fecha.substring(0, 10) >= hoyStr)
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
        .slice(0, 10);

    // Fechas marcadas en el calendario
    const markedDates = {};
    eventos.forEach((ev) => {
        const fecha = ev.fecha.substring(0, 10);
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
    };

    // ── Crear evento ──
    const guardarEvento = async () => {
        const tituloSanitizado = limitAndSanitize(titulo, 200);
        const descripcionSanitizada = limitAndSanitize(descripcion, 500);
        const { valid, error } = validateEvento(tituloSanitizado, diaSeleccionado);
        if (!valid) { Alert.alert(t.error, error); return; }

        setGuardando(true);
        try {
            await axios.post(ENDPOINTS.EVENTOS, {
                titulo: tituloSanitizado,
                descripcion: descripcionSanitizada,
                fecha: diaSeleccionado,
                color: colorSeleccionado,
            });
            Alert.alert(t.success, 'Evento guardado.');
            setTitulo(''); setDescripcion(''); setModalVisible(false);
            await cargarEventos();
        } catch (err) {
            logError('CalendarioScreen.guardarEvento', err);
            Alert.alert(t.error, getErrorMessage(err, 'No se pudo guardar el evento.'));
        } finally {
            setGuardando(false);
        }
    };

    // ── Abrir modal de edición ──
    const abrirEditar = (ev) => {
        setEventoEditando(ev);
        setEditTitulo(ev.titulo);
        setEditDescripcion(ev.descripcion || '');
        setEditColor(ev.color || COLORS_EVENTS[0]);
        setEditFecha(ev.fecha.substring(0, 10));
        setMostrarCalendarioEdit(false);
        setEditModalVisible(true);
    };

    // ── Guardar edición ──
    const guardarEdicion = async () => {
        const tituloSanitizado = limitAndSanitize(editTitulo, 200);
        const descripcionSanitizada = limitAndSanitize(editDescripcion, 500);

        if (!tituloSanitizado.trim()) {
            Alert.alert(t.error, 'El título es requerido.');
            return;
        }
        if (!editFecha) {
            Alert.alert(t.error, 'Selecciona una fecha.');
            return;
        }

        setEditGuardando(true);
        try {
            await axios.put(`${ENDPOINTS.EVENTOS}/${eventoEditando.id}`, {
                titulo: tituloSanitizado,
                descripcion: descripcionSanitizada,
                fecha: editFecha,
                color: editColor,
            });
            Alert.alert(t.success, 'Evento actualizado.');
            setEditModalVisible(false);
            setEventoEditando(null);
            await cargarEventos();
            // Si cambió la fecha, actualizar día seleccionado
            setDiaSeleccionado(editFecha);
        } catch (err) {
            logError('CalendarioScreen.guardarEdicion', err);
            Alert.alert(t.error, getErrorMessage(err, 'No se pudo actualizar el evento.'));
        } finally {
            setEditGuardando(false);
        }
    };

    // ── Eliminar evento ──
    const eliminarEvento = (id) => {
        Alert.alert('Eliminar', '¿Deseas eliminar este evento?', [
            { text: t.cancel, style: 'cancel' },
            {
                text: t.delete, style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${ENDPOINTS.EVENTOS}/${id}`);
                        await cargarEventos();
                    } catch (e) {
                        logError('CalendarioScreen.eliminarEvento', e);
                        Alert.alert(t.error, getErrorMessage(e, 'No se pudo eliminar el evento.'));
                    }
                },
            },
        ]);
    };

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

                {/* ══ Eventos del día seleccionado ══ */}
                {diaSeleccionado ? (
                    <>
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

                        <View style={styles.eventList}>
                            {eventosDelDia.length === 0 ? (
                                <View style={styles.noEventsCard}>
                                    <Text style={styles.noEventsEmoji}>📭</Text>
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
                                            style={styles.eventActionBtn}
                                            onPress={() => abrirEditar(ev)}
                                        >
                                            <Text style={{ fontSize: 18 }}>✏️</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.eventActionBtn}
                                            onPress={() => eliminarEvento(ev.id)}
                                        >
                                            <Text style={{ fontSize: 18 }}>🗑️</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}
                        </View>
                    </>
                ) : null}

                {/* ══ Próximos eventos ══ */}
                <View style={styles.upcomingSection}>
                    <Text style={styles.upcomingTitle}>📆 {t.upcomingEvents}</Text>

                    {cargando ? (
                        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.md }} />
                    ) : proximosEventos.length === 0 ? (
                        <View style={styles.noEventsCard}>
                            <Text style={styles.noEventsEmoji}>🌿</Text>
                            <Text style={styles.noEventsText}>{t.noUpcomingEvents}</Text>
                        </View>
                    ) : (
                        proximosEventos.map((ev) => {
                            const fechaStr = ev.fecha.substring(0, 10);
                            const esHoy = fechaStr === hoyStr;
                            return (
                                <TouchableOpacity
                                    key={ev.id}
                                    style={[styles.upcomingCard, esHoy && styles.upcomingCardToday]}
                                    activeOpacity={0.7}
                                    onPress={() => onDiaPress({ dateString: fechaStr })}
                                    onLongPress={() => abrirEditar(ev)}
                                >
                                    <View style={[styles.upcomingColorBar, { backgroundColor: ev.color || COLORS.primary }]} />
                                    <View style={styles.upcomingDateCol}>
                                        <Text style={styles.upcomingDateDay}>
                                            {new Date(fechaStr + 'T00:00:00').getDate()}
                                        </Text>
                                        <Text style={styles.upcomingDateMonth}>
                                            {formatDateShort(fechaStr).split(' ')[1] || formatDateShort(fechaStr)}
                                        </Text>
                                    </View>
                                    <View style={styles.upcomingInfo}>
                                        <Text style={styles.upcomingEventTitle}>{ev.titulo}</Text>
                                        {ev.descripcion ? (
                                            <Text style={styles.upcomingEventDesc} numberOfLines={1}>{ev.descripcion}</Text>
                                        ) : null}
                                    </View>
                                    <View style={[styles.upcomingBadge, { backgroundColor: (ev.color || COLORS.primary) + '22' }]}>
                                        <Text style={[styles.upcomingBadgeText, { color: ev.color || COLORS.primary }]}>
                                            {getDaysUntil(fechaStr)}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>

                <View style={{ height: SPACING.xxl }} />
            </ScrollView>

            {/* ══════════════════════════════════════════════ */}
            {/* Modal CREAR evento                            */}
            {/* ══════════════════════════════════════════════ */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={Keyboard.dismiss}>
                        <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
                            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
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
                                    returnKeyType="next"
                                />

                                <Text style={styles.label}>{t.eventDescription}</Text>
                                <TextInput
                                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                    value={descripcion}
                                    onChangeText={setDescripcion}
                                    placeholder="Detalles del evento..."
                                    placeholderTextColor={COLORS.textLight}
                                    multiline maxLength={500}
                                />

                                <Text style={styles.label}>Color</Text>
                                <View style={styles.colorRow}>
                                    {COLORS_EVENTS.map((c) => (
                                        <TouchableOpacity
                                            key={c}
                                            style={[styles.colorDot, { backgroundColor: c }, colorSeleccionado === c && styles.colorDotSelected]}
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
                                        {guardando ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t.save}</Text>}
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>

            {/* ══════════════════════════════════════════════ */}
            {/* Modal EDITAR evento                           */}
            {/* ══════════════════════════════════════════════ */}
            <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={Keyboard.dismiss}>
                        <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
                            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
                                <Text style={styles.modalTitle}>✏️ {t.editPesticide || 'Editar'} Evento</Text>

                                <Text style={styles.label}>{t.eventTitle}</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editTitulo}
                                    onChangeText={setEditTitulo}
                                    placeholder="Título del evento"
                                    placeholderTextColor={COLORS.textLight}
                                    maxLength={200}
                                />

                                <Text style={styles.label}>{t.eventDescription}</Text>
                                <TextInput
                                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                    value={editDescripcion}
                                    onChangeText={setEditDescripcion}
                                    placeholder="Descripción..."
                                    placeholderTextColor={COLORS.textLight}
                                    multiline maxLength={500}
                                />

                                {/* ── Selector de fecha ── */}
                                <Text style={styles.label}>{t.eventDate}</Text>
                                <TouchableOpacity
                                    style={styles.datePickerBtn}
                                    onPress={() => setMostrarCalendarioEdit(!mostrarCalendarioEdit)}
                                >
                                    <Text style={styles.datePickerText}>
                                        📅 {formatDateFull(editFecha)}
                                    </Text>
                                    <Text style={styles.datePickerArrow}>
                                        {mostrarCalendarioEdit ? '▲' : '▼'}
                                    </Text>
                                </TouchableOpacity>

                                {mostrarCalendarioEdit && (
                                    <Calendar
                                        current={editFecha}
                                        onDayPress={(day) => {
                                            setEditFecha(day.dateString);
                                            setMostrarCalendarioEdit(false);
                                        }}
                                        markedDates={{
                                            [editFecha]: { selected: true, selectedColor: COLORS.primary },
                                        }}
                                        theme={{
                                            calendarBackground: COLORS.surfaceGray,
                                            selectedDayBackgroundColor: COLORS.primary,
                                            selectedDayTextColor: '#fff',
                                            todayTextColor: COLORS.secondary,
                                            dayTextColor: COLORS.textPrimary,
                                            arrowColor: COLORS.primary,
                                            monthTextColor: COLORS.primaryDark,
                                            textDayFontWeight: '500',
                                            textMonthFontWeight: '800',
                                        }}
                                        style={styles.miniCalendar}
                                    />
                                )}

                                <Text style={styles.label}>Color</Text>
                                <View style={styles.colorRow}>
                                    {COLORS_EVENTS.map((c) => (
                                        <TouchableOpacity
                                            key={c}
                                            style={[styles.colorDot, { backgroundColor: c }, editColor === c && styles.colorDotSelected]}
                                            onPress={() => setEditColor(c)}
                                        />
                                    ))}
                                </View>

                                <View style={styles.modalActions}>
                                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                                        <Text style={styles.cancelBtnText}>{t.cancel}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.saveBtn, editGuardando && { opacity: 0.6 }]}
                                        onPress={guardarEdicion}
                                        disabled={editGuardando}
                                    >
                                        {editGuardando ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t.save}</Text>}
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
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

    // ── Día seleccionado ──
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

    // ── Lista de eventos del día ──
    eventList: { marginHorizontal: SPACING.md, marginTop: SPACING.sm },
    noEventsCard: {
        backgroundColor: COLORS.surface, borderRadius: 16,
        padding: SPACING.lg, alignItems: 'center', ...SHADOWS.small,
    },
    noEventsEmoji: { fontSize: 32, marginBottom: SPACING.xs },
    noEventsText: { color: COLORS.textLight, fontSize: 14 },
    eventCard: {
        backgroundColor: COLORS.surface, borderRadius: 16, marginBottom: SPACING.sm,
        flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
        borderLeftWidth: 5, ...SHADOWS.small,
    },
    eventBody: { flex: 1 },
    eventTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
    eventDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
    eventActionBtn: { padding: SPACING.xs, marginLeft: 4 },

    // ── Próximos eventos ──
    upcomingSection: { marginHorizontal: SPACING.md, marginTop: SPACING.lg },
    upcomingTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
    upcomingCard: {
        backgroundColor: COLORS.surface, borderRadius: 16,
        flexDirection: 'row', alignItems: 'center',
        marginBottom: SPACING.sm, overflow: 'hidden', ...SHADOWS.small,
    },
    upcomingCardToday: { borderWidth: 1.5, borderColor: COLORS.secondary },
    upcomingColorBar: {
        width: 5, height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0,
        borderTopLeftRadius: 16, borderBottomLeftRadius: 16,
    },
    upcomingDateCol: {
        width: 50, alignItems: 'center', justifyContent: 'center',
        paddingVertical: SPACING.md, marginLeft: SPACING.sm,
    },
    upcomingDateDay: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
    upcomingDateMonth: { fontSize: 11, fontWeight: '600', color: COLORS.textLight, textTransform: 'uppercase' },
    upcomingInfo: { flex: 1, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.md },
    upcomingEventTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
    upcomingEventDesc: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
    upcomingBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, marginRight: SPACING.md },
    upcomingBadgeText: { fontSize: 11, fontWeight: '700' },

    // ── Modal ──
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalCard: {
        backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: SPACING.lg, paddingBottom: SPACING.xxl, maxHeight: '85%',
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

    // ── Date picker button ──
    datePickerBtn: {
        backgroundColor: COLORS.surfaceGray, borderRadius: 12,
        paddingHorizontal: SPACING.md, paddingVertical: 14,
        borderWidth: 1.5, borderColor: COLORS.border,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    datePickerText: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '600' },
    datePickerArrow: { fontSize: 12, color: COLORS.textLight },
    miniCalendar: { borderRadius: 12, marginTop: SPACING.xs, marginBottom: SPACING.xs },

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
