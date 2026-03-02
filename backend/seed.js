/**
 * Ce-Kalan - Script de Seed
 * Genera hashes bcrypt reales e inserta usuarios en la DB
 * 
 * Uso: node seed.js
 */

const bcrypt = require('bcrypt');
const mysql2 = require('mysql2/promise');
require('dotenv').config();

const SALT_ROUNDS = 10;

const usuarios = [
    { nombre: 'Administrador', correo: 'admin@cekalan.com', password: 'Admin123!', tipo: 'admin' },
    { nombre: 'Juan García', correo: 'juan@cekalan.com', password: 'Juan123!', tipo: 'usuario' },
];

async function seed() {
    console.log('\n🌿 Ce-Kalan - Seed Script');
    console.log('================================\n');

    const pool = await mysql2.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'cekalan_db',
    });

    try {
        // Insertar usuarios con hash real
        for (const u of usuarios) {
            const hash = await bcrypt.hash(u.password, SALT_ROUNDS);

            // Eliminar si ya existe
            await pool.execute('DELETE FROM usuarios WHERE correo = ?', [u.correo]);

            // Insertar con hash correcto
            await pool.execute(
                'INSERT INTO usuarios (nombre, correo, password, tipo) VALUES (?, ?, ?, ?)',
                [u.nombre, u.correo, hash, u.tipo]
            );

            console.log(`✅ Usuario creado: ${u.correo} | password: ${u.password} | tipo: ${u.tipo}`);
        }

        // Seed plaguicidas
        const [rows] = await pool.execute("SELECT id FROM usuarios WHERE correo = 'admin@cekalan.com'");
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
        console.log(`\n✅ ${plaguicidas.length} plaguicidas insertados`);

        // Seed eventos y cálculos para Juan
        const [rowsJuan] = await pool.execute("SELECT id FROM usuarios WHERE correo = 'juan@cekalan.com'");
        const juanId = rowsJuan[0].id;

        await pool.execute('DELETE FROM calculos WHERE user_id = ?', [juanId]);
        await pool.execute(
            'INSERT INTO calculos (ancho, largo, dosis, resultado, notas, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [100, 200, 2.5, 5.0, 'Parcela norte - maíz', juanId]
        );
        await pool.execute(
            'INSERT INTO calculos (ancho, largo, dosis, resultado, notas, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [50, 80, 3.0, 1.2, 'Invernadero tomate', juanId]
        );
        console.log(`✅ 2 cálculos de ejemplo insertados`);

        await pool.execute('DELETE FROM eventos WHERE user_id = ?', [juanId]);
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
                [titulo, descripcion, fecha, color, juanId]
            );
        }
        console.log(`✅ ${eventos.length} eventos de calendario insertados\n`);

        console.log('================================');
        console.log('🎉 Seed completado exitosamente!');
        console.log('\nCredenciales para iniciar sesión:');
        console.log('  Admin  → admin@cekalan.com  / Admin123!');
        console.log('  Normal → juan@cekalan.com   / Juan123!');
        console.log('================================\n');

    } catch (error) {
        console.error('❌ Error en seed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('   Verifica que XAMPP/MySQL esté corriendo.');
        }
    } finally {
        await pool.end();
    }
}

seed();
