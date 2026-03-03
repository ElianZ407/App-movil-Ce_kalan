const mysql2 = require('mysql2/promise');
require('dotenv').config();

// ============================================================
// SEGURIDAD: Todas las credenciales vienen del archivo .env
// NUNCA hardcodees host, usuario, contraseña o nombre de BD.
// ============================================================

const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME'];
for (const v of requiredEnvVars) {
  if (!process.env[v]) {
    console.error(`❌ Variable de entorno faltante: ${v}`);
    console.error('   Asegúrate de que el archivo backend/.env existe y está configurado.');
    process.exit(1); // Detiene el servidor si falta config crítica
  }
}

const pool = mysql2.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '', // Vacío es válido para XAMPP por defecto
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

// Verificar conexión al iniciar
pool.getConnection()
  .then(conn => {
    console.log(`✅ Conectado a MySQL en ${process.env.DB_HOST}/${process.env.DB_NAME}`);
    conn.release();
  })
  .catch(err => {
    // No exponemos detalles técnicos de la conexión en producción
    console.error('❌ Error al conectar con MySQL.');
    console.error('   Verifica que XAMPP está corriendo y que los valores en .env son correctos.');
    if (process.env.NODE_ENV !== 'production') {
      console.error('   Detalle (solo visible en desarrollo):', err.message);
    }
  });

module.exports = pool;
