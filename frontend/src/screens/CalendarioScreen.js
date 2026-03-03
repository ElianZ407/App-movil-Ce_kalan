import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, ScrollView, Modal, ActivityIndicator,
    Animated, Easing
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { ENDPOINTS } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';

/* ================= LOCALE ================= */
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

    /* ================= ANIMACIONES ================= */
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    /* ================= CARGAR EVENTOS ================= */
    const cargarEventos = useCallback(async () => {
        setCargando(true);
        try {
            const res = await axios.get(ENDPOINTS.EVENTOS);
            setEventos(res.data.data || []);
        } catch (e) {
            console.error('Error al cargar eventos:', e);
        } finally {
            setCargando(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { cargarEventos(); }, [cargarEventos]));

    /* ================= MARCAR FECHAS ================= */
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

    /* ================= SELECCIONAR DÍA ================= */
    const onDiaPress = (day) => {

        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            })
        ]).start();

        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();

        setDiaSeleccionado(day.dateString);

        const evs = eventos.filter(
            (ev) => ev.fecha.substring(0, 10) === day.dateString
        );
        setEventosDelDia(evs);
    };

    /* ================= GUARDAR ================= */
    const guardarEvento = async () => {
        if (!titulo.trim() || !diaSeleccionado) {
            Alert.alert(t.error, 'Selecciona un día y escribe un título.');
            return;
        }

        setGuardando(true);
        try {
            await axios.post(ENDPOINTS.EVENTOS, {
                titulo: titulo.trim(),
                descripcion: descripcion.trim(),
                fecha: diaSeleccionado,
                color: colorSeleccionado,
            });

            Alert.alert(t.success, 'Evento guardado.');
            setTitulo('');
            setDescripcion('');
            setModalVisible(false);
            await cargarEventos();

        } catch (error) {
            Alert.alert(t.error, 'No se pudo guardar el evento.');
        } finally {
            setGuardando(false);
        }
    };

    /* ================= ELIMINAR ================= */
    const eliminarEvento = (id) => {
        Alert.alert('Eliminar', '¿Deseas eliminar este evento?', [
            { text: t.cancel, style: 'cancel' },
            {
                text: t.delete,
                style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${ENDPOINTS.EVENTOS}/${id}`);
                        await cargarEventos();
                        setEventosDelDia((prev) => prev.filter((e) => e.id !== id));
                    } catch {
                        Alert.alert(t.error, 'No se pudo eliminar.');
                    }
                },
            },
        ]);
    };

    const hoyStr = new Date().toISOString().substring(0, 10);

    return (
        <View style={styles.container}>

            {/* HEADER */}
            <View style={styles.headerBg}>
                <Text style={styles.headerEmoji}>📅</Text>
                <Text style={styles.headerTitle}>{t.calendarTitle}</Text>
            </View>

            <ScrollView>

                {/* CALENDARIO ANIMADO */}
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
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
                            selectedDayTextColor: '#fff',
                            todayTextColor: COLORS.secondary,
                            arrowColor: COLORS.primary,
                            monthTextColor: COLORS.primaryDark,
                        }}
                        style={styles.calendar}
                    />
                </Animated.View>

                {/* EVENTOS ANIMADOS */}
                {diaSeleccionado && (
                    <Animated.View
                        style={[
                            styles.eventList,
                            {
                                opacity: fadeAnim,
                                transform: [{
                                    translateY: fadeAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [20, 0]
                                    })
                                }]
                            }
                        ]}
                    >
                        <View style={styles.selectedDayContainer}>
                            <Text style={styles.selectedDayTitle}>
                                {t.eventsFor} {diaSeleccionado}
                            </Text>

                            <TouchableOpacity
                                style={styles.addEventBtn}
                                activeOpacity={0.7}
                                onPress={() => setModalVisible(true)}
                            >
                                <Text style={styles.addEventBtnText}>
                                    + {t.addEvent}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {eventosDelDia.length === 0 ? (
                            <View style={styles.noEventsCard}>
                                <Text style={styles.noEventsText}>
                                    {t.noEvents}
                                </Text>
                            </View>
                        ) : (
                            eventosDelDia.map((ev) => (
                                <View
                                    key={ev.id}
                                    style={[
                                        styles.eventCard,
                                        { borderLeftColor: ev.color || COLORS.primary }
                                    ]}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.eventTitle}>{ev.titulo}</Text>
                                        {ev.descripcion ?
                                            <Text style={styles.eventDesc}>{ev.descripcion}</Text>
                                            : null}
                                    </View>

                                    <TouchableOpacity onPress={() => eliminarEvento(ev.id)}>
                                        <Text>🗑️</Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </Animated.View>
                )}
            </ScrollView>

            {/* MODAL */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{t.addEvent}</Text>

                        <TextInput
                            style={styles.input}
                            value={titulo}
                            onChangeText={setTitulo}
                            placeholder="Ej: Aplicar fumigación"
                        />

                        <TextInput
                            style={[styles.input, { height: 80 }]}
                            value={descripcion}
                            onChangeText={setDescripcion}
                            placeholder="Detalles..."
                            multiline
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text>{t.cancel}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={guardarEvento}
                            >
                                {guardando
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={{ color: '#fff' }}>{t.save}</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
}

/* ================= ESTILOS ================= */

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    headerBg: {
        backgroundColor: COLORS.primaryDark,
        paddingVertical: SPACING.xl,
        alignItems: 'center',
    },
    headerEmoji: { fontSize: 34 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },

    calendar: {
        margin: SPACING.md,
        borderRadius: 16,
        overflow: 'hidden',
        ...SHADOWS.medium
    },

    selectedDayContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },

    selectedDayTitle: {
        fontWeight: '700',
        fontSize: 15,
        color: COLORS.textPrimary
    },

    addEventBtn: {
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },

    addEventBtnText: {
        fontWeight: '700',
        fontSize: 13
    },

    eventList: {
        marginHorizontal: SPACING.md,
        paddingBottom: SPACING.xxl,
    },

    noEventsCard: {
        backgroundColor: COLORS.surface,
        padding: SPACING.md,
        borderRadius: 16,
        alignItems: 'center',
    },

    noEventsText: {
        color: COLORS.textLight
    },

    eventCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderLeftWidth: 5,
        flexDirection: 'row',
        alignItems: 'center',
        ...SHADOWS.small
    },

    eventTitle: {
        fontWeight: '700',
        fontSize: 15
    },

    eventDesc: {
        fontSize: 13,
        color: COLORS.textSecondary
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end'
    },

    modalCard: {
        backgroundColor: COLORS.surface,
        padding: SPACING.lg,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
    },

    modalTitle: {
        fontWeight: '800',
        fontSize: 18,
        marginBottom: SPACING.md
    },

    input: {
        backgroundColor: COLORS.surfaceGray,
        borderRadius: 12,
        padding: 12,
        marginBottom: SPACING.sm
    },

    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },

    cancelBtn: {
        flex: 1,
        marginRight: 5,
        padding: 12,
        alignItems: 'center',
        backgroundColor: COLORS.surfaceGray,
        borderRadius: 12,
    },

    saveBtn: {
        flex: 1,
        marginLeft: 5,
        padding: 12,
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 12,
    }
});