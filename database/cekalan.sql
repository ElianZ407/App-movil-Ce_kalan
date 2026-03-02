-- ============================================================
-- Ce-Kalan - Script de Base de Datos MySQL para XAMPP
-- ============================================================

CREATE DATABASE IF NOT EXISTS cekalan_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cekalan_db;

-- ============================================================
-- Tabla: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    tipo ENUM('admin', 'usuario') NOT NULL DEFAULT 'usuario',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- Tabla: plaguicidas
-- ============================================================
CREATE TABLE IF NOT EXISTS plaguicidas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    imagen_url VARCHAR(500) DEFAULT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- Tabla: calculos
-- ============================================================
CREATE TABLE IF NOT EXISTS calculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ancho DECIMAL(10,2) NOT NULL,
    largo DECIMAL(10,2) NOT NULL,
    dosis DECIMAL(10,4) NOT NULL,
    resultado DECIMAL(12,4) NOT NULL,
    notas TEXT DEFAULT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- Tabla: eventos
-- ============================================================
CREATE TABLE IF NOT EXISTS eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT DEFAULT NULL,
    fecha DATE NOT NULL,
    color VARCHAR(7) DEFAULT '#2E7D32',
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- DATOS DE PRUEBA (SEED DATA)
-- ============================================================
-- Usuarios precargados con contraseñas hasheadas con bcrypt (10 rounds)
--
--  👤 ADMIN
--     Correo  : admin@cekalan.com
--     Password: Admin123!
--
--  👤 USUARIO NORMAL
--     Correo  : juan@cekalan.com
--     Password: Juan123!
-- ============================================================

INSERT INTO usuarios (nombre, correo, password, tipo) VALUES
(
  'Administrador',
  'admin@cekalan.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
  'admin'
),
(
  'Juan García',
  'juan@cekalan.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
  'usuario'
);

-- ============================================================
-- Plaguicidas de ejemplo (creados por el admin, user_id = 1)
-- ============================================================
INSERT INTO plaguicidas (nombre, tipo, imagen_url, user_id) VALUES
('Glifosato 360', 'Herbicida', NULL, 1),
('Clorpirifos 48 EC', 'Insecticida', NULL, 1),
('Mancozeb 80 WP', 'Fungicida', NULL, 1),
('2,4-D Amina', 'Herbicida', NULL, 1),
('Imidacloprid 70 WS', 'Insecticida', NULL, 1),
('Propiconazol 25 EC', 'Fungicida', NULL, 1);

-- ============================================================
-- Cálculos de ejemplo (del usuario juan, user_id = 2)
-- ============================================================
INSERT INTO calculos (ancho, largo, dosis, resultado, notas, user_id) VALUES
(100.00, 200.00, 2.5000, 5.0000, 'Parcela norte - maíz', 2),
(50.00,  80.00,  3.0000, 1.2000, 'Invernadero tomate', 2),
(300.00, 150.00, 1.8000, 8.1000, 'Campo sur - frijol', 2);

-- ============================================================
-- Eventos de calendario de ejemplo (user_id = 2)
-- ============================================================
INSERT INTO eventos (titulo, descripcion, fecha, color, user_id) VALUES
('Aplicar Glifosato',      'Parcela norte, dosis 2.5 L/ha', DATE_ADD(CURDATE(), INTERVAL 2 DAY),  '#2E7D32', 2),
('Revisión de cultivos',   'Inspección general del campo',   DATE_ADD(CURDATE(), INTERVAL 5 DAY),  '#FFA000', 2),
('Compra de insumos',      'Ferretería agrícola El Campo',   DATE_ADD(CURDATE(), INTERVAL 7 DAY),  '#1565C0', 2),
('Fumigación invernadero', 'Usar Mancozeb 80 WP',            DATE_ADD(CURDATE(), INTERVAL 10 DAY), '#AD1457', 2),
('Cosecha parcela este',   NULL,                             DATE_ADD(CURDATE(), INTERVAL 15 DAY), '#2E7D32', 2);
