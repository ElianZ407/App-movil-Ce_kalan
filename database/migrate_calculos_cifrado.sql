-- ============================================================
-- Ce-Kalan - Migración: Cifrado de la tabla calculos
-- ============================================================
-- Ejecutar en phpMyAdmin o MySQL CLI ANTES de reiniciar el backend.
--
-- Este script convierte las columnas numéricas de cálculos a
-- VARCHAR(500) para almacenar texto cifrado AES-256-GCM.
--
-- ⚠️  ADVERTENCIA: Los cálculos existentes se eliminarán porque
--     sus valores numéricos no pueden descifarse automáticamente.
--     Después de la migración, usa seed.js para re-insertar datos
--     de prueba ya cifrados.
-- ============================================================

USE cekalan_db;

-- 1. Limpiar cálculos existentes (estaban en texto plano, no cifrados)
DELETE FROM calculos;

-- 2. Modificar columnas para aceptar texto cifrado
ALTER TABLE calculos
    MODIFY COLUMN ancho     VARCHAR(500) NOT NULL,
    MODIFY COLUMN largo     VARCHAR(500) NOT NULL,
    MODIFY COLUMN dosis     VARCHAR(500) NOT NULL,
    MODIFY COLUMN resultado VARCHAR(500) NOT NULL;

-- Verificar cambios
DESCRIBE calculos;
