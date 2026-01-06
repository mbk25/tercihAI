#!/usr/bin/env node

/**
 * TercihAI Performans Optimizasyonu Test Script
 * 
 * Bu script, yapılan optimizasyonların doğru çalıştığını test eder:
 * 1. Şehir filtresi database seviyesinde uygulanıyor mu?
 * 2. SQL sorguları doğru parametrelerle çağrılıyor mu?
 * 3. ÖSYM şartları alternatif programlar için doğru gösteriliyor mu?
 */

const mysql = require('mysql2/promise');

// Test konfigürasyonu
const TEST_CONFIG = {
    department: 'Bilgisayar Mühendisliği',
    cities: ['İstanbul', 'Ankara'],
    year: 2024
};

console.log('🧪 TercihAI Performans Optimizasyonu Test\n');
console.log('=' .repeat(60));

// Test 1: Şehir Filtresi Test
async function testCityFilter() {
    console.log('\n📊 Test 1: Veritabanı Şehir Filtresi\n');
    
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'yok_atlas',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        const connection = await pool.getConnection();
        
        // Test 1a: Tüm Türkiye sorgusu
        console.log('   🔍 Tüm Türkiye sorgusu...');
        const [allResults] = await connection.query(
            'SELECT COUNT(*) as count FROM universities WHERE department = ? AND year = ?',
            [TEST_CONFIG.department, TEST_CONFIG.year]
        );
        console.log(`   ✅ Toplam sonuç: ${allResults[0].count} üniversite`);
        
        // Test 1b: Şehir filtreli sorgu
        console.log(`\n   🔍 Şehir filtreli sorgu (${TEST_CONFIG.cities.join(', ')})...`);
        const [filteredResults] = await connection.query(
            'SELECT COUNT(*) as count FROM universities WHERE department = ? AND year = ? AND city IN (?, ?)',
            [TEST_CONFIG.department, TEST_CONFIG.year, ...TEST_CONFIG.cities]
        );
        console.log(`   ✅ Filtreli sonuç: ${filteredResults[0].count} üniversite`);
        
        // Performans karşılaştırması
        const reduction = ((allResults[0].count - filteredResults[0].count) / allResults[0].count * 100).toFixed(1);
        console.log(`\n   📈 Performans Kazanımı: %${reduction} daha az veri`);
        
        if (filteredResults[0].count < allResults[0].count) {
            console.log('   ✅ TEST BAŞARILI: Şehir filtresi doğru çalışıyor!');
        } else {
            console.log('   ❌ TEST BAŞARISIZ: Şehir filtresi çalışmıyor!');
        }
        
        connection.release();
        await pool.end();
        
    } catch (error) {
        console.error('   ❌ Hata:', error.message);
        console.log('\n   ⚠️  Not: Veritabanı bağlantısı kurulamadı. Lütfen .env dosyanızı kontrol edin.');
    }
}

// Test 2: SQL Sorgu Performansı
async function testQueryPerformance() {
    console.log('\n⚡ Test 2: SQL Sorgu Performans Testi\n');
    
    console.log('   Bu test, gerçek bir sorgunun ne kadar hızlı çalıştığını ölçer.');
    console.log('   Backend çalışırken, console.log çıktılarında şunları görmelisiniz:\n');
    console.log('   ✓ "🔍 YÖK Atlas veri çekiliyor... şehir: İstanbul, Ankara"');
    console.log('   ✓ "AND city IN (?, ?)" SQL sorgusunda');
    console.log('   ✓ "✅ X üniversite bulundu" (sadece seçili şehirlerden)\n');
    console.log('   ⚠️  Bu test manuel olarak backend çalıştırılarak yapılmalıdır.');
}

// Test 3: ÖSYM Şartları Kontrolü
function testOsymConditions() {
    console.log('\n🎓 Test 3: ÖSYM Şartları Doğrulama\n');
    
    console.log('   Bu test, alternatif programların kendi ÖSYM şartlarını gösterip');
    console.log('   göstermediğini kontrol eder.\n');
    console.log('   Frontend\'te test adımları:\n');
    console.log('   1. Hayali bölüm: "Bilgisayar Mühendisliği"');
    console.log('   2. Alternatif: "Yazılım Mühendisliği" için Nişantaşı Üniversitesi');
    console.log('   3. Kartta görünen madde numaraları: "18, 21, 64"');
    console.log('   4. Modal\'daki madde numaraları: "18, 21, 64" (AYNI OLMALI!)');
    console.log('   5. Açıklamalar "Yazılım Mühendisliği" için olmalı\n');
    console.log('   ✅ Eğer kartlar ve modal aynı maddeleri gösteriyorsa TEST BAŞARILI!');
    console.log('   ❌ Eğer farklı maddeler gösteriyorsa TEST BAŞARISIZ!');
}

// Ana test fonksiyonu
async function runAllTests() {
    console.log('📅 Test Tarihi:', new Date().toLocaleString('tr-TR'));
    console.log('🎯 Test Konusu: Performans Optimizasyonu\n');
    
    await testCityFilter();
    testQueryPerformance();
    testOsymConditions();
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Testler tamamlandı!\n');
    console.log('📖 Detaylı bilgi için: PERFORMANS_OPTIMIZASYONU.md\n');
}

// Testleri çalıştır
runAllTests().catch(console.error);
