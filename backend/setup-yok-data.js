// YÖK Atlas Veri Çekme ve Kurulum Scripti
const { fetchAllDepartmentsData, fetchDepartmentData } = require('./yok-atlas-real');
const { pool } = require('./db');
require('dotenv').config();

console.log('\n🎓 ==========================================');
console.log('📚 YÖK Atlas Veri Kurulum Scripti');
console.log('==========================================\n');

async function setupYokData() {
    try {
        console.log('📊 Veritabanı bağlantısı test ediliyor...');
        
        const connection = await pool.getConnection();
        console.log('✅ MySQL bağlantısı başarılı\n');
        
        // Veritabanı tablosunu oluştur
        console.log('📋 Universities tablosu kontrol ediliyor...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS universities (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                city VARCHAR(100) NOT NULL,
                department VARCHAR(150) NOT NULL,
                campus VARCHAR(255),
                minRanking INT NOT NULL COMMENT 'En düşük sıralama (taban)',
                quota INT DEFAULT 0,
                enrolled INT DEFAULT 0,
                type ENUM('Devlet', 'Vakıf') DEFAULT 'Devlet',
                year INT DEFAULT 2024,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_uni_dept_year (name, department, year),
                INDEX idx_department (department),
                INDEX idx_city (city),
                INDEX idx_ranking (minRanking)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tablo hazır\n');
        
        connection.release();
        
        // Menü göster
        console.log('═══════════════════════════════════════════');
        console.log('Seçenekler:');
        console.log('1. Tüm bölümler için veri çek (10-15 dk)');
        console.log('2. Tek bölüm için veri çek (hızlı test)');
        console.log('3. Mevcut verileri listele');
        console.log('═══════════════════════════════════════════\n');
        
        const args = process.argv.slice(2);
        const choice = args[0] || '2'; // Varsayılan: Tek bölüm
        
        if (choice === '1') {
            console.log('🚀 Tüm bölümler için veri çekiliyor...\n');
            console.log('⚠️  Bu işlem 10-15 dakika sürebilir!');
            console.log('⚠️  YÖK Atlas sitesini yormamak için bölümler arasında 2sn beklenir\n');
            
            const results = await fetchAllDepartmentsData(2024);
            
            console.log('\n✅ Toplu veri çekme tamamlandı!');
            console.log('══════════════════════════════════════');
            console.log(`✅ Başarılı bölümler: ${results.success.length}`);
            results.success.forEach(r => {
                console.log(`   • ${r.department}: ${r.count} üniversite`);
            });
            
            if (results.failed.length > 0) {
                console.log(`\n⚠️  Başarısız bölümler: ${results.failed.length}`);
                results.failed.forEach(dept => {
                    console.log(`   • ${dept}`);
                });
            }
            
        } else if (choice === '2') {
            const department = args[1] || 'Bilgisayar Mühendisliği';
            
            console.log(`🔍 "${department}" için veri çekiliyor...\n`);
            
            const data = await fetchDepartmentData(department, 2024);
            
            console.log(`\n✅ ${data.length} üniversite verisi alındı!`);
            console.log('══════════════════════════════════════\n');
            
            if (data.length > 0) {
                console.log('İlk 5 üniversite:');
                data.slice(0, 5).forEach((uni, i) => {
                    console.log(`${i + 1}. ${uni.name} (${uni.city})`);
                    console.log(`   Sıralama: ${uni.minRanking.toLocaleString('tr-TR')}`);
                    console.log(`   Kontenjan: ${uni.quota}\n`);
                });
            }
            
            console.log('\n💡 Tüm bölümler için veri çekmek isterseniz:');
            console.log('   node setup-yok-data.js 1\n');
            
        } else if (choice === '3') {
            console.log('📊 Mevcut veriler listeleniyor...\n');
            
            const connection = await pool.getConnection();
            
            const [departments] = await connection.query(`
                SELECT 
                    department,
                    COUNT(*) as uni_count,
                    MIN(minRanking) as min_rank,
                    MAX(minRanking) as max_rank,
                    SUM(quota) as total_quota
                FROM universities
                WHERE year = 2024
                GROUP BY department
                ORDER BY min_rank ASC
            `);
            
            connection.release();
            
            if (departments.length === 0) {
                console.log('⚠️  Henüz veri yok. Önce veri çekin:\n');
                console.log('   node setup-yok-data.js 1  (Tüm bölümler)');
                console.log('   node setup-yok-data.js 2  (Tek bölüm)\n');
            } else {
                console.log('═══════════════════════════════════════════════════════════');
                console.log('Bölüm'.padEnd(35) + 'Ünv.  Min.Sıra   Max.Sıra   Kontenjan');
                console.log('═══════════════════════════════════════════════════════════');
                
                departments.forEach(dept => {
                    console.log(
                        dept.department.padEnd(35) +
                        dept.uni_count.toString().padEnd(6) +
                        dept.min_rank.toLocaleString('tr-TR').padEnd(11) +
                        dept.max_rank.toLocaleString('tr-TR').padEnd(11) +
                        dept.total_quota
                    );
                });
                
                console.log('═══════════════════════════════════════════════════════════');
                console.log(`\nToplam: ${departments.length} bölüm\n`);
            }
        }
        
        await pool.end();
        console.log('\n✅ İşlem tamamlandı!\n');
        
    } catch (error) {
        console.error('\n❌ Hata:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

setupYokData();
