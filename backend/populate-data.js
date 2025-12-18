const { pool } = require('./db');
const { generateMockData } = require('./yokAtlasScraper');

async function populateData() {
    try {
        console.log('🔄 Veritabanı dolduruluyor...\n');
        
        const departments = [
            'Bilgisayar Programcılığı',
            'Web Tasarım ve Kodlama',
            'Bilgisayar Teknolojisi',
            'Bilgisayar Mühendisliği',
            'Yazılım Mühendisliği',
            'Makine Mühendisliği',
            'Tıp',
            'Hukuk',
            'İşletme',
            'Elektrik-Elektronik Mühendisliği',
            'Mimarlık',
            'Psikoloji'
        ];
        
        for (const dept of departments) {
            console.log(`📝 ${dept} ekleniyor...`);
            const data = generateMockData(dept, 2024);
            
            const connection = await pool.getConnection();
            
            // Önce sil
            await connection.query('DELETE FROM universities WHERE department = ? AND year = 2024', [dept]);
            
            // Yeni verileri ekle
            for (const uni of data) {
                await connection.query(
                    'INSERT INTO universities (name, city, department, campus, ranking, quota, type, year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [uni.name, uni.city, uni.department, uni.campus, uni.ranking, uni.quota, uni.type, uni.year]
                );
            }
            
            connection.release();
            console.log(`✅ ${data.length} üniversite eklendi\n`);
        }
        
        // Sonuçları kontrol et
        const [rows] = await pool.query(
            "SELECT department, COUNT(*) as count FROM universities GROUP BY department"
        );
        
        console.log('\n📊 Veritabanı Özeti:');
        console.log('═══════════════════════════════════════');
        rows.forEach(r => {
            console.log(`${r.department}: ${r.count} üniversite`);
        });
        console.log('═══════════════════════════════════════\n');
        
        // İstanbul'daki Bilgisayar Programcılığı
        const [istanbulData] = await pool.query(
            "SELECT * FROM universities WHERE department = 'Bilgisayar Programcılığı' AND city LIKE '%İstanbul%' ORDER BY ranking"
        );
        
        console.log(`\n🏙️ İstanbul'da Bilgisayar Programcılığı: ${istanbulData.length} üniversite`);
        istanbulData.slice(0, 10).forEach((u, i) => {
            console.log(`${i+1}. ${u.name} (${u.type}) - Sıralama: ${u.ranking.toLocaleString()}`);
        });
        
        await pool.end();
        console.log('\n✅ Tamamlandı!');
        
    } catch (error) {
        console.error('❌ Hata:', error);
        process.exit(1);
    }
}

populateData();
