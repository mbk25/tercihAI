/**
 * Veritabanından İstanbul Ebelik bölümlerini çek
 */

const { pool } = require('./db');

async function getIstanbulEbelik() {
    console.log('\n📊 Veritabanından İstanbul Ebelik Bölümleri Çekiliyor...\n');

    try {
        const connection = await pool.getConnection();

        // Ebelik bölümlerini ara
        const [results] = await connection.query(`
            SELECT * FROM universities 
            WHERE (department LIKE '%Ebelik%' OR department LIKE '%ebelik%')
            AND (city LIKE '%İstanbul%' OR city LIKE '%istanbul%')
            ORDER BY ranking ASC, minRanking ASC
            LIMIT 10
        `);

        connection.release();

        if (results.length === 0) {
            console.log('❌ Veritabanında İstanbul Ebelik bölümü bulunamadı.\n');
            console.log('💡 Öneri: YÖK Atlas scraper ile veri çekin:\n');
            console.log('   node yok-atlas-comprehensive-scraper.js\n');
            return [];
        }

        console.log(`✅ ${results.length} kayıt bulundu:\n`);
        console.log('═'.repeat(80));

        results.forEach((uni, index) => {
            console.log(`\n${index + 1}. ${uni.name}`);
            console.log(`   📍 Şehir: ${uni.city}`);
            console.log(`   🏫 Kampüs: ${uni.campus || 'Belirtilmemiş'}`);
            console.log(`   🎓 Bölüm: ${uni.department}`);
            console.log(`   🏛️  Tür: ${uni.type}`);
            console.log(`   👥 Kontenjan: ${uni.quota}`);
            console.log(`   📈 Yerleşen: ${uni.enrolled || 'N/A'}`);
            console.log(`   🎯 Sıralama: ${uni.ranking?.toLocaleString('tr-TR') || uni.minRanking?.toLocaleString('tr-TR') || 'N/A'}`);
            console.log(`   📊 Puan: ${uni.minScore || 'N/A'}`);
            console.log(`   📅 Yıl: ${uni.year || '2024'}`);
        });

        console.log('\n' + '═'.repeat(80));
        console.log(`\n💾 Toplam ${results.length} üniversite\n`);

        return results;

    } catch (error) {
        console.error('❌ Veritabanı hatası:', error.message);
        return [];
    }
}

if (require.main === module) {
    getIstanbulEbelik()
        .then(() => {
            console.log('✅ İşlem tamamlandı!\n');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Fatal hata:', error);
            process.exit(1);
        });
}

module.exports = { getIstanbulEbelik };
