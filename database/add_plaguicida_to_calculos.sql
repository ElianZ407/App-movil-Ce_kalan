-- ============================================================
-- Ce-Kalan - Migración: Agregar plaguicida_id y unidad a calculos
-- ============================================================
-- Ejecutar este script UNA SOLA VEZ en phpMyAdmin.
-- Asegúrate de tener seleccionada la base de datos "cekalan_db".
-- ============================================================

USE cekalan_db;

ALTER TABLE calculos
ADD COLUMN plaguicida_id INT DEFAULT NULL;

ALTER TABLE calculos
ADD COLUMN unidad VARCHAR(10) DEFAULT 'L';

ALTER TABLE calculos
ADD CONSTRAINT fk_calculos_plaguicida
FOREIGN KEY (plaguicida_id) REFERENCES plaguicidas(id) ON DELETE SET NULL;
