import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { COLORS } from '../constants/theme';

// Screens - Auth
import LoginScreen from '../screens/LoginScreen';
import RegistroScreen from '../screens/RegistroScreen';

// Screens - App
import CalculadoraScreen from '../screens/CalculadoraScreen';
import PlaguicidasScreen from '../screens/PlaguicidasScreen';
import CalendarioScreen from '../screens/CalendarioScreen';
import PerfilScreen from '../screens/PerfilScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ============================================================
// Tab Navigator (pantallas principales autenticadas)
// ============================================================
function AppTabs() {
    const { t } = useLanguage();

    const TabIcon = ({ emoji, focused }) => (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>
        </View>
    );

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: COLORS.primaryDark,
                    borderTopWidth: 0,
                    height: 65,
                    paddingBottom: 8,
                    paddingTop: 4,
                    elevation: 20,
                    shadowColor: COLORS.primaryDark,
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                },
                tabBarActiveTintColor: COLORS.secondary,
                tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            }}
        >
            <Tab.Screen
                name="Calculadora"
                component={CalculadoraScreen}
                options={{
                    tabBarLabel: t.calculator,
                    tabBarIcon: ({ focused }) => <TabIcon emoji="🧪" focused={focused} />,
                }}
            />
            <Tab.Screen
                name="Plaguicidas"
                component={PlaguicidasScreen}
                options={{
                    tabBarLabel: t.pesticides,
                    tabBarIcon: ({ focused }) => <TabIcon emoji="🧴" focused={focused} />,
                }}
            />
            <Tab.Screen
                name="Calendario"
                component={CalendarioScreen}
                options={{
                    tabBarLabel: t.calendar,
                    tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
                }}
            />
            <Tab.Screen
                name="Perfil"
                component={PerfilScreen}
                options={{
                    tabBarLabel: t.profile,
                    tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
                }}
            />
        </Tab.Navigator>
    );
}

// ============================================================
// Stack Navigator raíz
// ============================================================
export default function AppNavigator() {
    const { usuario, cargando } = useAuth();

    if (cargando) {
        return (
            <View style={styles.loading}>
                <Text style={styles.loadingEmoji}>🌿</Text>
                <Text style={styles.loadingText}>Ce-Kalan</Text>
                <ActivityIndicator color={COLORS.secondary} size="large" style={{ marginTop: 20 }} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {usuario ? (
                    // App autenticada
                    <Stack.Screen name="AppMain" component={AppTabs} />
                ) : (
                    // Flujo de autenticación
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Registro" component={RegistroScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        backgroundColor: COLORS.primaryDark,
    },
    loadingEmoji: { fontSize: 60, marginBottom: 16 },
    loadingText: {
        fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: 3
    },
});
