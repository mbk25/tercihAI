/**
 * Verita banı şemasını güncelle - enrolled kolonunu ekle
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateDatabaseSchema() {
    console.log('📊 Veritabanı şeması güncelleniyor...\n');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'tercihAI',
        port: process.env.DB_PORT || 3306
    });

    try {
        // enrolled kolonunu ekle (yoksa)
        await connection.query(`
            ALTER TABLE universities 
            ADD COLUMN IF NOT EXISTS enrolled INT AFTER quota
        `);
        console.log('✅ enrolled kolonu eklendi\n');

        // minScore kolonunu ekle (yoksa)
        await connection.query(`
            ALTER TABLE universities 
            ADD COLUMN IF NOT EXISTS minScore DECIMAL(6,2) AFTER minRanking
        `);
        console.log('✅ minScore kolonu eklendi\n');

        // educationLanguage kolonunu ekle (yoksa)
        await connection.query(`
            ALTER TABLE universities 
            ADD COLUMN IF NOT EXISTS educationLanguage VARCHAR(50) DEFAULT 'Türkçe' AFTER minScore
        `);
        console.log('✅ educationLanguage kolonu eklendi\n');

        // educationType kolonunu ekle (yoksa)
        await connection.query(`
            ALTER TABLE universities 
            ADD COLUMN IF NOT EXISTS educationType VARCHAR(50) DEFAULT 'Örgün Öğretim' AFTER educationLanguage
        `);
        console.log('✅ educationType kolonu eklendi\n');

        // scholarshipRate kolonunu ekle (yoksa)
        await connection.query(`
            ALTER TABLE universities 
            ADD COLUMN IF NOT EXISTS scholarshipRate VARCHAR(50) AFTER educationType
        `);
        console.log('✅ scholarshipRate kolonu eklendi\n');

        console.log('🎉 Veritabanı şeması başarıyla güncellendi!\n');

    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await connection.end();
    }
}

updateDatabaseSchema();
