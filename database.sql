-- DATABASE SCHEMA FOR AMT MONITORING SYSTEM
-- Run this in your XAMPP phpMyAdmin to create the structure

CREATE DATABASE IF NOT EXISTS amt_monitoring;
USE amt_monitoring;

-- 1. Locations Table
CREATE TABLE locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- 2. Violation Types Table
CREATE TABLE violation_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 3. AMT (Crew) Table
CREATE TABLE amt_crew (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    location_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id)
);

-- 4. Cases (Block/Unblock History)
CREATE TABLE cases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    amt_id INT NOT NULL,
    violation_type_id INT NOT NULL,
    status ENUM('BLOCKED', 'UNBLOCKED') DEFAULT 'BLOCKED',
    
    block_date DATE NOT NULL,
    unblock_date DATE,
    
    -- BAP Details
    -- Added BAP/Coaching as the lowest level
    punishment_level ENUM('None', 'BAP/Coaching', 'Surat Teguran', 'SP 1', 'SP 2', 'SP 3', 'PHK'),
    punishment_end_date DATE, -- Calculated based on level duration
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (amt_id) REFERENCES amt_crew(id),
    FOREIGN KEY (violation_type_id) REFERENCES violation_types(id)
);

-- Seed Initial Data (Locations)
INSERT INTO locations (name) VALUES 
('FT Krueng Raya'), ('FT Lhokseumawe'), ('FT Medan Group'), ('FT Sibolga'), ('FT Gunung Sitoli'),
('IT Teluk Kabung'), ('FT Sei Siak'), ('IT Dumai'), ('FT Indragiri Hilir'), ('IT Kertapati'),
('FT Jambi'), ('FT Pulau Baai'), ('FT Pangkal Balam'), ('FT Tanjung Pandan'), ('IT Panjang'),
('IT Manggis'), ('FT Sanggaran'), ('IT Ampenan'), ('FT Badas'), ('FT Bima'), ('FT Waingapu'),
('FT Tenau'), ('FT Maumere'), ('FT Ende'), ('FT Reo'), ('Depo Semper'), ('FT Atapupu'),
('PTPL Surabaya'), ('IT Pontianak'), ('IT Balikpapan'), ('FT Samarinda'), ('IT Banjarmasin'),
('Jobber Berau (Pengawas Utama)'), ('IT Makassar'), ('FT Parepare'), ('FT Palopo'),
('FT Donggala'), ('FT Gorontalo'), ('FT Moutong'), ('IT Bitung'), ('FT Kendari'), ('FT Baubau'),
('FT Pulau Raha'), ('FT Poso'), ('FT Kolonodale'), ('FT Tolitoli'), ('FT Kolaka'), ('FT Tahuna'),
('FT Banggai'), ('FT Luwuk'), ('FT Wayame'), ('FT Namlea'), ('FT Masohi'), ('FT Tobelo'),
('FT Jayapura'), ('FT Timika'), ('IT AVIASI SUMBAGSEL');

-- Seed Initial Data (Violations)
INSERT INTO violation_types (name) VALUES
('Overspeed'), ('Rotasi AMT'), ('Blackzone'), ('Tidak Koperatif'), ('Merokok'),
('Phone Detection'), ('Seatbelt Detection'), ('Merubah Arah Kamera'),
('Menutup Kamera Depan (DSM)'), ('Fraud'), ('Fraud Ownuse'), ('Laka Lantas');