CREATE DATABASE IF NOT EXISTS steammotor_db;
USE steammotor_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tanggal DATE NOT NULL,
    no_polisi VARCHAR(20) NOT NULL,
    jenis_kendaraan ENUM('Motor Bebek', 'Motor Matic', 'Motor Sport') NOT NULL,
    harga DECIMAL(10,2) NOT NULL,
    petugas VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Data (password: admin123)
-- Hash generated from bcrypt
INSERT INTO users (username, password) VALUES ('admin', '$2a$10$xF/5UI.yShda8AHLFkKZMOcfv6sJdI.f35NS/cufNVqn5cdP.IuW.')
ON DUPLICATE KEY UPDATE password='$2a$10$xF/5UI.yShda8AHLFkKZMOcfv6sJdI.f35NS/cufNVqn5cdP.IuW.';

INSERT INTO transactions (tanggal, no_polisi, jenis_kendaraan, harga, petugas) VALUES
('2026-03-10', 'B 1234 ABC', 'Motor Matic', 20000.00, 'Budi'),
('2026-03-11', 'D 5678 EFG', 'Motor Sport', 35000.00, 'Andi');
