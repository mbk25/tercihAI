const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Singleton pool instance
let pool = null;

// Localhost MySQL configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tercihAI',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
};

// Singleton pool getter
function getPool() {
    if (!pool) {
        pool = mysql.createPool(dbConfig);
    }
    return pool;
}

const poolInstance = getPool();

// Veritabanı bağlantısını test et
async function testConnection() {
    try {
        const currentPool = getPool();
        const connection = await currentPool.getConnection();
        console.log('✅ MySQL bağlantısı başarılı (Localhost)');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ MySQL bağlantı hatası:', error.message);
        return false;
    }
}

// Veritabanı tablolarını kontrol et (CREATE DATABASE kaldırıldı, Cloud'da zaten var)
async function initDatabase() {
    try {
        const currentPool = getPool();
        const connection = await currentPool.getConnection();

        // Not: Cloud sunucularda 'CREATE DATABASE' genelde yetki hatası verir
        // veya zaten 'defaultdb' adında bir veritabanı vardır.
        // O yüzden sadece tabloları oluşturuyoruz.

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

        // Üniversiteler tablosu
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

        // Admin kullanıcısı (Sadece yoksa ekler)
        const [rows] = await connection.query("SELECT * FROM users WHERE username = 'admin'");
        if (rows.length === 0) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.query(`
                INSERT INTO users (username, password, email, name, role) 
                VALUES ('admin', ?, 'admin@tercihAI.com', 'Admin', 'admin')
            `, [hashedPassword]);
            console.log('✅ Admin kullanıcısı oluşturuldu.');
        }

        connection.release();
        console.log('✅ Veritabanı tabloları senkronize edildi.');
        return true;
    } catch (error) {
        console.error('❌ Veritabanı başlatma hatası:', error.message);
        return false;
    }
}

module.exports = {
    pool: poolInstance,
    testConnection,
    initDatabase
};