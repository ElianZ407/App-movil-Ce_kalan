-- ============================================================
-- Ce-Kalan - Migración: Agregar columna 'stock' a plaguicidas
-- ============================================================
-- Ejecutar este script UNA SOLA VEZ en tu base de datos.
-- Uso: Pegar en phpMyAdmin > pestaña SQL, o ejecutar con mysql CLI.
-- ============================================================

ALTER TABLE plaguicidas
ADD COLUMN stock DECIMAL(10, 2) DEFAULT NULL
COMMENT 'Stock disponible en litros. NULL = sin seguimiento de stock.';

-- Verificar que se agregó correctamente
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'plaguicidas'
  AND COLUMN_NAME = 'stock';
