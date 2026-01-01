const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// MySQL bağlantı havuzu
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tercihAI',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

// Veritabanı bağlantısını test et
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL bağlantısı başarılı');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ MySQL bağlantı hatası:', error.message);
        return false;
    }
}

// Veritabanı tablolarını oluştur
async function initDatabase() {
    try {
        const connection = await pool.getConnection();

        // Veritabanını oluştur
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'tercihAI'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await connection.query(`USE ${process.env.DB_NAME || 'tercihAI'}`);

        // Kullanıcılar tablosu
        await connection.query(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Analizler tablosu
        await connection.query(`
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
                INDEX idx_userId (userId),
                INDEX idx_createdAt (createdAt),
                INDEX idx_dreamDept (dreamDept)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Üniversiteler tablosu (zaten var, sadece yoksa oluştur)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS universities (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                city VARCHAR(100),
                department VARCHAR(255),
                campus VARCHAR(255),
                ranking INT,
                minRanking INT,
                minScore DECIMAL(6,2),
                quota INT,
                enrolled INT,
                type ENUM('Devlet', 'Vakıf') DEFAULT 'Devlet',
                educationLanguage VARCHAR(50) DEFAULT 'Türkçe',
                educationType VARCHAR(50) DEFAULT 'Örgün Öğretim',
                scholarshipRate VARCHAR(50),
                year INT DEFAULT 2024,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_department (department),
                INDEX idx_city (city),
                INDEX idx_ranking (ranking),
                INDEX idx_minRanking (minRanking),
                INDEX idx_type (type),
                INDEX idx_year (year),
                INDEX idx_composite_search (department, city, type, year)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Sohbet geçmişi tablosu
        await connection.query(`
            CREATE TABLE IF NOT EXISTS chat_history (
                id INT PRIMARY KEY AUTO_INCREMENT,
                userId INT,
                sessionId VARCHAR(100),
                message TEXT NOT NULL,
                role ENUM('user', 'assistant') NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_userId (userId),
                INDEX idx_sessionId (sessionId),
                INDEX idx_createdAt (createdAt)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Admin kullanıcısı ekle (şifre: admin123)
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await connection.query(`
            INSERT IGNORE INTO users (username, password, email, name, role) 
            VALUES ('admin', ?, 'admin@tercihAI.com', 'Admin', 'admin')
        `, [hashedPassword]);

        // Örnek üniversite verileri ekle
        const sampleUniversities = [
            ['Boğaziçi Üniversitesi', 'İstanbul', 'Bilgisayar Mühendisliği', 'Bebek Kampüsü', 3000, 80, 'Devlet', 2024],
            ['İstanbul Teknik Üniversitesi', 'İstanbul', 'Bilgisayar Mühendisliği', 'Maslak Kampüsü', 5000, 100, 'Devlet', 2024],
            ['Orta Doğu Teknik Üniversitesi', 'Ankara', 'Bilgisayar Mühendisliği', 'Merkez Kampüs', 8000, 120, 'Devlet', 2024],
            ['Hacettepe Üniversitesi', 'Ankara', 'Bilgisayar Mühendisliği', 'Beytepe Kampüsü', 15000, 90, 'Devlet', 2024],
            ['Koç Üniversitesi', 'İstanbul', 'Bilgisayar Mühendisliği', 'Rumeli Feneri Kampüsü', 2000, 50, 'Vakıf', 2024],
            ['Sabancı Üniversitesi', 'İstanbul', 'Bilgisayar Mühendisliği', 'Tuzla Kampüsü', 4000, 60, 'Vakıf', 2024],
            ['Bilkent Üniversitesi', 'Ankara', 'Bilgisayar Mühendisliği', 'Merkez Kampüs', 7000, 70, 'Vakıf', 2024],
            ['Ege Üniversitesi', 'İzmir', 'Bilgisayar Mühendisliği', 'Bornova Kampüsü', 40000, 85, 'Devlet', 2024],
            ['Ankara Üniversitesi', 'Ankara', 'Bilgisayar Mühendisliği', 'Tandoğan Kampüsü', 35000, 75, 'Devlet', 2024],
            ['Marmara Üniversitesi', 'İstanbul', 'Bilgisayar Mühendisliği', 'Göztepe Kampüsü', 65000, 95, 'Devlet', 2024]
        ];

        for (const uni of sampleUniversities) {
            await connection.query(`
                INSERT IGNORE INTO universities (name, city, department, campus, ranking, minRanking, quota, type, year) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [uni[0], uni[1], uni[2], uni[3], uni[4], uni[4], uni[5], uni[6], uni[7]]);
        }

        connection.release();
        console.log('✅ Veritabanı tabloları oluşturuldu');
        return true;
    } catch (error) {
        console.error('❌ Veritabanı oluşturma hatası:', error.message);
        return false;
    }
}

module.exports = {
    pool,
    testConnection,
    initDatabase
};
