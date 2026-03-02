const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// Middlewares Globales
// ============================================================
app.use(cors({
    origin: '*', // En producción, restringir a las IPs/dominios específicos
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes subidas)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// Rutas de la API
// ============================================================
const authRoutes = require('./routes/auth');
const plaguicidasRoutes = require('./routes/plaguicidas');
const calculosRoutes = require('./routes/calculos');
const eventosRoutes = require('./routes/eventos');

app.use('/api/auth', authRoutes);
app.use('/api/plaguicidas', plaguicidasRoutes);
app.use('/api/calculos', calculosRoutes);
app.use('/api/eventos', eventosRoutes);

// Ruta de bienvenida
app.get('/', (req, res) => {
    res.json({
        success: true,
        mensaje: '🌿 Ce-Kalan API - Gestión de Plaguicidas',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            plaguicidas: '/api/plaguicidas',
            calculos: '/api/calculos',
            eventos: '/api/eventos',
        }
    });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        mensaje: 'Ruta no encontrada.'
    });
});

// Manejo global de errores
app.use((err, req, res, next) => {
    console.error('Error global:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, mensaje: 'La imagen es demasiado grande (máx. 10MB).' });
    }
    res.status(500).json({
        success: false,
        mensaje: err.message || 'Error interno del servidor.'
    });
});

// ============================================================
// Iniciar servidor
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('🌿 ====================================');
    console.log('   Ce-Kalan API Server');
    console.log('🌿 ====================================');
    console.log(`✅ Servidor corriendo en: http://localhost:${PORT}`);
    console.log(`📱 Para Expo Go usa tu IP local: http://TU_IP_LOCAL:${PORT}`);
    console.log('   (Ej: http://192.168.1.X:3001)');
    console.log('🌿 ====================================');
    console.log('');
});

module.exports = app;
