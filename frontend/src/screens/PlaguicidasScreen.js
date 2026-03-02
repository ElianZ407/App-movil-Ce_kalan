import React, { useState, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, ScrollView, Image, ActivityIndicator, Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { ENDPOINTS, UPLOADS_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';

export default function PlaguicidasScreen() {
    const [plaguicidas, setPlaguicidas] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [nombre, setNombre] = useState('');
    const [tipo, setTipo] = useState('');
    const [imagenUri, setImagenUri] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [editandoId, setEditandoId] = useState(null);

    const { esAdmin } = useAuth();
    const { t } = useLanguage();

    const cargarPlaguicidas = useCallback(async () => {
        setCargando(true);
        try {
            const res = await axios.get(ENDPOINTS.PLAGUICIDAS);
            setPlaguicidas(res.data.data || []);
        } catch (e) {
            console.error('Error al cargar plaguicidas:', e);
        } finally {
            setCargando(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { cargarPlaguicidas(); }, [cargarPlaguicidas]));

    const abrirModal = (item = null) => {
        if (item) {
            setEditandoId(item.id);
            setNombre(item.nombre);
            setTipo(item.tipo);
            setImagenUri(item.imagen_url ? `${UPLOADS_BASE_URL}${item.imagen_url}` : null);
        } else {
            setEditandoId(null);
            setNombre('');
            setTipo('');
            setImagenUri(null);
        }
        setModalVisible(true);
    };

    const cerrarModal = () => {
        setModalVisible(false);
        setNombre('');
        setTipo('');
        setImagenUri(null);
        setEditandoId(null);
    };

    const tomarFoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t.error, 'Se necesita permiso para acceder a la cámara.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, aspect: [4, 3], quality: 0.8,
        });
        if (!result.canceled) setImagenUri(result.assets[0].uri);
    };

    const elegirFoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t.error, 'Se necesita permiso para acceder a la galería.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, aspect: [4, 3], quality: 0.8,
        });
        if (!result.canceled) setImagenUri(result.assets[0].uri);
    };

    const guardar = async () => {
        if (!nombre.trim() || !tipo.trim()) {
            Alert.alert(t.error, t.required);
            return;
        }
        setGuardando(true);
        try {
            const formData = new FormData();
            formData.append('nombre', nombre.trim());
            formData.append('tipo', tipo.trim());

            // Añadir imagen solo si es un URI local (nueva imagen)
            if (imagenUri && imagenUri.startsWith('file://')) {
                const filename = imagenUri.split('/').pop();
                const ext = filename.split('.').pop().toLowerCase();
                formData.append('imagen', {
                    uri: imagenUri,
                    name: filename,
                    type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
                });
            }

            const config = {
                headers: { 'Content-Type': 'multipart/form-data' },
            };

            if (editandoId) {
                await axios.put(`${ENDPOINTS.PLAGUICIDAS}/${editandoId}`, formData, config);
            } else {
                await axios.post(ENDPOINTS.PLAGUICIDAS, formData, config);
            }

            Alert.alert(t.success, editandoId ? 'Plaguicida actualizado.' : 'Plaguicida creado.');
            cerrarModal();
            cargarPlaguicidas();
        } catch (error) {
            Alert.alert(t.error, error?.response?.data?.mensaje || 'Error al guardar.');
        } finally {
            setGuardando(false);
        }
    };

    const eliminar = (id) => {
        Alert.alert('Eliminar', '¿Deseas eliminar este plaguicida?', [
            { text: t.cancel, style: 'cancel' },
            {
                text: t.delete, style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${ENDPOINTS.PLAGUICIDAS}/${id}`);
                        cargarPlaguicidas();
                    } catch (e) {
                        Alert.alert(t.error, 'No se pudo eliminar.');
                    }
                },
            },
        ]);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerBg}>
                <Text style={styles.headerEmoji}>🧴</Text>
                <Text style={styles.headerTitle}>{t.pesticidesTitle}</Text>
                {esAdmin() && (
                    <TouchableOpacity style={styles.addBtn} onPress={() => abrirModal()}>
                        <Text style={styles.addBtnText}>+ {t.addPesticide}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {!esAdmin() && (
                <View style={styles.infoBar}>
                    <Text style={styles.infoBarText}>👁️ {t.adminOnly}</Text>
                </View>
            )}

            {cargando ? (
                <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} size="large" />
            ) : plaguicidas.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyEmoji}>🌿</Text>
                    <Text style={styles.emptyText}>{t.noPesticides}</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.list}>
                    {plaguicidas.map((item) => (
                        <View key={item.id} style={styles.card}>
                            {item.imagen_url ? (
                                <Image
                                    source={{ uri: `${UPLOADS_BASE_URL}${item.imagen_url}` }}
                                    style={styles.cardImage}
                                />
                            ) : (
                                <View style={styles.cardImagePlaceholder}>
                                    <Text style={styles.cardImageEmoji}>🧴</Text>
                                </View>
                            )}
                            <View style={styles.cardBody}>
                                <Text style={styles.cardName}>{item.nombre}</Text>
                                <View style={styles.typeBadge}>
                                    <Text style={styles.typeBadgeText}>{item.tipo}</Text>
                                </View>
                            </View>
                            {esAdmin() && (
                                <View style={styles.cardActions}>
                                    <TouchableOpacity
                                        style={styles.editBtn}
                                        onPress={() => abrirModal(item)}
                                    >
                                        <Text style={styles.editBtnText}>✏️</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.deleteItemBtn}
                                        onPress={() => eliminar(item.id)}
                                    >
                                        <Text style={styles.deleteItemBtnText}>🗑️</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* Modal para crear/editar */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>
                            {editandoId ? t.editPesticide : t.addPesticide}
                        </Text>

                        <Text style={styles.label}>{t.pesticideName}</Text>
                        <TextInput
                            style={styles.input}
                            value={nombre}
                            onChangeText={setNombre}
                            placeholder="Ej: Glifosato"
                            placeholderTextColor={COLORS.textLight}
                        />

                        <Text style={styles.label}>{t.pesticideType}</Text>
                        <TextInput
                            style={styles.input}
                            value={tipo}
                            onChangeText={setTipo}
                            placeholder="Ej: Herbicida"
                            placeholderTextColor={COLORS.textLight}
                        />

                        <Text style={styles.label}>{t.pesticideImage}</Text>
                        {imagenUri && (
                            <Image source={{ uri: imagenUri }} style={styles.previewImage} />
                        )}
                        <View style={styles.imageRow}>
                            <TouchableOpacity style={styles.imgBtn} onPress={tomarFoto}>
                                <Text style={styles.imgBtnText}>📷 {t.takePhoto}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.imgBtn} onPress={elegirFoto}>
                                <Text style={styles.imgBtnText}>🖼️ {t.choosePhoto}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={cerrarModal}>
                                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveBtn, guardando && { opacity: 0.6 }]}
                                onPress={guardar}
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
        alignItems: 'center', paddingTop: SPACING.xxl, paddingBottom: SPACING.lg,
    },
    headerEmoji: { fontSize: 36, marginBottom: 4 },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: SPACING.sm },
    addBtn: {
        backgroundColor: COLORS.secondary, paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm, borderRadius: 20, ...SHADOWS.small,
    },
    addBtnText: { color: COLORS.primaryDark, fontWeight: '700', fontSize: 14 },
    infoBar: {
        backgroundColor: '#FFF3E0', padding: SPACING.sm, alignItems: 'center',
        borderBottomWidth: 1, borderColor: '#FFE0B2',
    },
    infoBarText: { color: '#E65100', fontSize: 13, fontWeight: '600' },
    list: { padding: SPACING.md },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xxl },
    emptyEmoji: { fontSize: 60, marginBottom: SPACING.md },
    emptyText: { fontSize: 16, color: COLORS.textLight, textAlign: 'center' },
    card: {
        backgroundColor: COLORS.surface, borderRadius: 16, marginBottom: SPACING.md,
        flexDirection: 'row', alignItems: 'center', overflow: 'hidden', ...SHADOWS.small,
    },
    cardImage: { width: 80, height: 80, resizeMode: 'cover' },
    cardImagePlaceholder: {
        width: 80, height: 80, backgroundColor: COLORS.border,
        justifyContent: 'center', alignItems: 'center',
    },
    cardImageEmoji: { fontSize: 32 },
    cardBody: { flex: 1, padding: SPACING.md },
    cardName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
    typeBadge: {
        backgroundColor: '#E8F5E9', borderRadius: 10,
        paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start',
    },
    typeBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
    cardActions: { flexDirection: 'column', padding: SPACING.sm, gap: SPACING.xs },
    editBtn: { padding: 8 },
    editBtnText: { fontSize: 20 },
    deleteItemBtn: { padding: 8 },
    deleteItemBtnText: { fontSize: 20 },
    // Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: SPACING.lg, paddingBottom: SPACING.xxl,
    },
    modalTitle: {
        fontSize: 20, fontWeight: '800', color: COLORS.textPrimary,
        marginBottom: SPACING.md, textAlign: 'center',
    },
    label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, marginTop: SPACING.sm },
    input: {
        backgroundColor: COLORS.surfaceGray, borderRadius: 12,
        paddingHorizontal: SPACING.md, paddingVertical: 13,
        fontSize: 15, color: COLORS.textPrimary,
        borderWidth: 1.5, borderColor: COLORS.border,
    },
    previewImage: {
        width: '100%', height: 150, borderRadius: 12,
        marginVertical: SPACING.sm, resizeMode: 'cover',
    },
    imageRow: { flexDirection: 'row', gap: SPACING.sm, marginVertical: SPACING.sm },
    imgBtn: {
        flex: 1, backgroundColor: COLORS.background, borderRadius: 12,
        paddingVertical: 12, alignItems: 'center',
        borderWidth: 1.5, borderColor: COLORS.border,
    },
    imgBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
    modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
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
