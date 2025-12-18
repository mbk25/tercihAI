-- TercihAI Veritabanı Oluşturma
CREATE DATABASE IF NOT EXISTS tercihAI CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tercihAI;

-- Kullanıcılar Tablosu
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    googleId VARCHAR(255) UNIQUE,
    picture VARCHAR(500),
    role ENUM('user', 'admin') DEFAULT 'user',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_googleId (googleId),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Analizler Tablosu
CREATE TABLE IF NOT EXISTS analyses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT,
    ranking INT NOT NULL,
    gender VARCHAR(50),
    dreamDept VARCHAR(255),
    city VARCHAR(255),
    currentLocation VARCHAR(255),
    results JSON,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_userId (userId),
    INDEX idx_createdAt (createdAt),
    INDEX idx_dreamDept (dreamDept)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Üniversiteler Tablosu
CREATE TABLE IF NOT EXISTS universities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    department VARCHAR(255),
    campus VARCHAR(255),
    ranking INT,
    quota INT,
    type ENUM('Devlet', 'Vakıf') DEFAULT 'Devlet',
    year INT DEFAULT 2024,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_department (department),
    INDEX idx_city (city),
    INDEX idx_ranking (ranking),
    INDEX idx_year (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sohbet Geçmişi Tablosu
CREATE TABLE IF NOT EXISTS chat_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT,
    sessionId VARCHAR(100),
    message TEXT NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_userId (userId),
    INDEX idx_sessionId (sessionId),
    INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin kullanıcısı ekle (şifre: admin123)
INSERT INTO users (username, password, email, name, role) 
VALUES ('admin', '$2a$10$rXzE7FKqW5Y7qZ7Qc5zYr.5aVP8kJ7KqW9Qm5YYqZ7Y7qZ7Qc5zYr', 'admin@tercihAI.com', 'Admin', 'admin')
ON DUPLICATE KEY UPDATE username=username;

-- Örnek üniversite verileri
INSERT INTO universities (name, city, department, campus, ranking, quota, type, year) VALUES
('Boğaziçi Üniversitesi', 'İstanbul', 'Bilgisayar Mühendisliği', 'Bebek Kampüsü', 3000, 80, 'Devlet', 2024),
('İstanbul Teknik Üniversitesi', 'İstanbul', 'Bilgisayar Mühendisliği', 'Maslak Kampüsü', 5000, 100, 'Devlet', 2024),
('Orta Doğu Teknik Üniversitesi', 'Ankara', 'Bilgisayar Mühendisliği', 'Merkez Kampüs', 8000, 120, 'Devlet', 2024),
('Hacettepe Üniversitesi', 'Ankara', 'Bilgisayar Mühendisliği', 'Beytepe Kampüsü', 15000, 90, 'Devlet', 2024),
('Koç Üniversitesi', 'İstanbul', 'Bilgisayar Mühendisliği', 'Rumeli Feneri Kampüsü', 2000, 50, 'Vakıf', 2024),
('Sabancı Üniversitesi', 'İstanbul', 'Bilgisayar Mühendisliği', 'Tuzla Kampüsü', 4000, 60, 'Vakıf', 2024),
('Bilkent Üniversitesi', 'Ankara', 'Bilgisayar Mühendisliği', 'Merkez Kampüs', 7000, 70, 'Vakıf', 2024),
('Ege Üniversitesi', 'İzmir', 'Bilgisayar Mühendisliği', 'Bornova Kampüsü', 40000, 85, 'Devlet', 2024),
('Ankara Üniversitesi', 'Ankara', 'Bilgisayar Mühendisliği', 'Tandoğan Kampüsü', 35000, 75, 'Devlet', 2024),
('Marmara Üniversitesi', 'İstanbul', 'Bilgisayar Mühendisliği', 'Göztepe Kampüsü', 65000, 95, 'Devlet', 2024)
ON DUPLICATE KEY UPDATE name=name;

SELECT 'Veritabanı başarıyla oluşturuldu!' as Message;
