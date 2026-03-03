// SOLO MODIFIQUÉ LA PARTE VISUAL Y TEXTOS

export default function LoginScreen({ navigation }) {
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [cargando, setCargando] = useState(false);
    const [mostrarPassword, setMostrarPassword] = useState(false);

    const { login } = useAuth();
    const { t, idioma, cambiarIdioma } = useLanguage();

    const handleLogin = async () => {
        if (!correo.trim() || !password.trim()) {
            Alert.alert(t.error, t.required);
            return;
        }
        setCargando(true);
        try {
            await login(correo.trim(), password);
        } catch (error) {
            const msg = error?.response?.data?.mensaje || t.loginError;
            Alert.alert(t.error, msg);
        } finally {
            setCargando(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                {/* HEADER TEMÁTICO */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoEmoji}>🧪🌾</Text>
                    </View>

                    <Text style={styles.appName}>AgroControl</Text>

                    <Text style={styles.tagline}>
                        Sistema de Gestión y Control de Pesticidas Agrícolas
                    </Text>

                    <Text style={styles.subTagline}>
                        Monitorea • Registra • Administra aplicaciones fitosanitarias
                    </Text>

                    {/* Selector de idioma */}
                    <View style={styles.langRow}>
                        <TouchableOpacity
                            style={[styles.langBtn, idioma === 'es' && styles.langBtnActive]}
                            onPress={() => cambiarIdioma('es')}
                        >
                            <Text style={[styles.langText, idioma === 'es' && styles.langTextActive]}>
                                🇲🇽 Español
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.langBtn, idioma === 'en' && styles.langBtnActive]}
                            onPress={() => cambiarIdioma('en')}
                        >
                            <Text style={[styles.langText, idioma === 'en' && styles.langTextActive]}>
                                🇺🇸 English
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* FORMULARIO */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Acceso al Sistema</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Correo institucional</Text>
                        <TextInput
                            style={styles.input}
                            value={correo}
                            onChangeText={setCorreo}
                            placeholder="usuario@agrocontrol.com"
                            placeholderTextColor={COLORS.textLight}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Contraseña</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Ingrese su contraseña"
                                placeholderTextColor={COLORS.textLight}
                                secureTextEntry={!mostrarPassword}
                            />
                            <TouchableOpacity
                                style={styles.eyeBtn}
                                onPress={() => setMostrarPassword(!mostrarPassword)}
                            >
                                <Text style={styles.eyeIcon}>
                                    {mostrarPassword ? '🙈' : '👁️'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, cargando && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={cargando}
                    >
                        {cargando ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>
                                Iniciar Sesión
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkBtn}
                        onPress={() => navigation.navigate('Registro')}
                    >
                        <Text style={styles.linkText}>
                            ¿No tienes cuenta?{' '}
                            <Text style={styles.linkHighlight}>
                                Registrar aplicador
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* FOOTER PROFESIONAL */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        🌿 Plataforma de Control Fitosanitario • Seguridad Agrícola
                    </Text>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}