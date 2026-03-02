// ============================================================
// Ce-Kalan - Paleta de Colores Oficial
// ============================================================
export const COLORS = {
    // Primarios
    primary: '#2E7D32',       // Verde Esmeralda Principal
    primaryDark: '#1B5E20',   // Verde Oscuro
    primaryLight: '#4CAF50',  // Verde Claro
    primaryMedium: '#388E3C', // Verde Medio

    // Secundarios (Ámbar)
    secondary: '#FFA000',     // Ámbar Principal
    secondaryDark: '#FF6F00', // Ámbar Oscuro
    secondaryLight: '#FFD54F',// Ámbar Claro
    accent: '#FFCA28',        // Dorado/Ámbar Brillante

    // Fondos
    background: '#F1F8E9',    // Verde muy claro (fondo)
    surface: '#FFFFFF',       // Blanco puro (cards)
    surfaceGray: '#F5F5F5',   // Gris claro

    // Texto
    textPrimary: '#1B2A1E',   // Texto oscuro
    textSecondary: '#4A694D', // Texto secundario
    textLight: '#78909C',     // Texto claro/gris
    textWhite: '#FFFFFF',     // Texto blanco

    // Estado
    success: '#43A047',
    warning: '#FFA000',
    error: '#C62828',
    info: '#0277BD',

    // Bordes y sombras
    border: '#C8E6C9',
    shadow: 'rgba(46, 125, 50, 0.15)',

    // Gradientes (para LinearGradient)
    gradientPrimary: ['#1B5E20', '#2E7D32', '#388E3C'],
    gradientSecondary: ['#FFA000', '#FFB300'],
    gradientCard: ['#F1F8E9', '#E8F5E9'],
};

// ============================================================
// Tipografía
// ============================================================
export const FONTS = {
    regular: 'System',
    bold: 'System',
    sizes: {
        xs: 11,
        sm: 13,
        md: 15,
        lg: 17,
        xl: 20,
        xxl: 24,
        xxxl: 30,
    },
};

// ============================================================
// Espaciado
// ============================================================
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

// ============================================================
// Bordes y sombras - Estilos reutilizables
// ============================================================
export const SHADOWS = {
    small: {
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    medium: {
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    large: {
        shadowColor: '#1B5E20',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
    },
};
