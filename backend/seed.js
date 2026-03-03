/**
 * Ce-Kalan - Script de Seed
 * Lee credenciales desde .env y genera hashes bcrypt reales.
 *
 * Uso: node seed.js
 *
 * Las credenciales de prueba se definen en backend/.env:
 *   SEED_ADMIN_CORREO, SEED_ADMIN_PASSWORD, SEED_ADMIN_NOMBRE
 *   SEED_USER_CORREO,  SEED_USER_PASSWORD,  SEED_USER_NOMBRE
 */

const bcrypt = require('bcrypt');
const mysql2 = require('mysql2/promise');
require('dotenv').config();

const SALT_ROUNDS = 10;

// ============================================================
// Validar que todas las variables necesarias estén definidas
// ============================================================
const requiredVars = [
    'DB_HOST', 'DB_USER', 'DB_NAME',
    'SEED_ADMIN_NOMBRE', 'SEED_ADMIN_CORREO', 'SEED_ADMIN_PASSWORD',
    'SEED_USER_NOMBRE', 'SEED_USER_CORREO', 'SEED_USER_PASSWORD',
];

const missing = requiredVars.filter(v => !process.env[v]);
if (missing.length > 0) {
    console.error('❌ Faltan variables de entorno en .env:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\nCopia backend/.env.example como backend/.env y completa los valores.');
    process.exit(1);
}

// Usuarios leídos exclusivamente desde .env (sin datos hardcodeados)
const usuarios = [
    {
        nombre: process.env.SEED_ADMIN_NOMBRE,
        correo: process.env.SEED_ADMIN_CORREO,
        password: process.env.SEED_ADMIN_PASSWORD,
        tipo: 'admin',
    },
    {
        nombre: process.env.SEED_USER_NOMBRE,
        correo: process.env.SEED_USER_CORREO,
        password: process.env.SEED_USER_PASSWORD,
        tipo: 'usuario',
    },
];

async function seed() {
    console.log('\n🌿 Ce-Kalan - Seed Script');
    console.log('================================\n');

    const pool = mysql2.createPool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME,
    });

    try {
        // Insertar usuarios con hash bcrypt real
        for (const u of usuarios) {
            const hash = await bcrypt.hash(u.password, SALT_ROUNDS);

            await pool.execute('DELETE FROM usuarios WHERE correo = ?', [u.correo]);
            await pool.execute(
                'INSERT INTO usuarios (nombre, correo, password, tipo) VALUES (?, ?, ?, ?)',
                [u.nombre, u.correo, hash, u.tipo]
            );

            // NUNCA imprimir la contraseña en texto plano
            console.log(`✅ Usuario creado: ${u.correo} | tipo: ${u.tipo}`);
        }

        // Seed plaguicidas (admin)
        const [rows] = await pool.execute(
            'SELECT id FROM usuarios WHERE correo = ?',
            [process.env.SEED_ADMIN_CORREO]
        );
        const adminId = rows[0].id;

        await pool.execute('DELETE FROM plaguicidas WHERE user_id = ?', [adminId]);
        const plaguicidas = [
            ['Glifosato 360', 'Herbicida'],
            ['Clorpirifos 48 EC', 'Insecticida'],
            ['Mancozeb 80 WP', 'Fungicida'],
            ['2,4-D Amina', 'Herbicida'],
            ['Imidacloprid 70 WS', 'Insecticida'],
            ['Propiconazol 25 EC', 'Fungicida'],
        ];
        for (const [nombre, tipo] of plaguicidas) {
            await pool.execute(
                'INSERT INTO plaguicidas (nombre, tipo, user_id) VALUES (?, ?, ?)',
                [nombre, tipo, adminId]
            );
        }
        console.log(`✅ ${plaguicidas.length} plaguicidas insertados`);

        // Seed cálculos y eventos (usuario normal)
        const [rowsUser] = await pool.execute(
            'SELECT id FROM usuarios WHERE correo = ?',
            [process.env.SEED_USER_CORREO]
        );
        const userId = rowsUser[0].id;

        await pool.execute('DELETE FROM calculos WHERE user_id = ?', [userId]);
        const calculos = [
            [100, 200, 2.5, 5.0, 'Parcela norte - maíz'],
            [50, 80, 3.0, 1.2, 'Invernadero tomate'],
            [300, 150, 1.8, 8.1, 'Campo sur - frijol'],
        ];
        for (const [ancho, largo, dosis, resultado, notas] of calculos) {
            await pool.execute(
                'INSERT INTO calculos (ancho, largo, dosis, resultado, notas, user_id) VALUES (?, ?, ?, ?, ?, ?)',
                [ancho, largo, dosis, resultado, notas, userId]
            );
        }
        console.log(`✅ ${calculos.length} cálculos de ejemplo insertados`);

        await pool.execute('DELETE FROM eventos WHERE user_id = ?', [userId]);
        const hoy = new Date();
        const addDays = (d) => {
            const dt = new Date(hoy);
            dt.setDate(dt.getDate() + d);
            return dt.toISOString().substring(0, 10);
        };
        const eventos = [
            ['Aplicar Glifosato', 'Parcela norte, dosis 2.5 L/ha', addDays(2), '#2E7D32'],
            ['Revisión de cultivos', 'Inspección general del campo', addDays(5), '#FFA000'],
            ['Compra de insumos', 'Ferretería agrícola El Campo', addDays(7), '#1565C0'],
            ['Fumigación invernadero', 'Usar Mancozeb 80 WP', addDays(10), '#AD1457'],
        ];
        for (const [titulo, descripcion, fecha, color] of eventos) {
            await pool.execute(
                'INSERT INTO eventos (titulo, descripcion, fecha, color, user_id) VALUES (?, ?, ?, ?, ?)',
                [titulo, descripcion, fecha, color, userId]
            );
        }
        console.log(`✅ ${eventos.length} eventos de calendario insertados\n`);

        console.log('================================');
        console.log('🎉 Seed completado exitosamente!');
        console.log('Las credenciales están en el archivo backend/.env');
        console.log('================================\n');

    } catch (error) {
        // No exponemos stack traces, solo mensaje genérico
        console.error('❌ Error en seed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('   Verifica que XAMPP/MySQL esté corriendo.');
        }
    } finally {
        await pool.end();
    }
}

seed();
