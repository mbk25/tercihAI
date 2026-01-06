const { pool } = require('./db');

async function checkBezmialem() {
    console.log('🔍 Bezmialem Vakıf Üniversitesi veritabanında aranıyor...\n');
    
    try {
        // Tüm Bezmialem kayıtlarını bul
        const [rows] = await pool.query(
            `SELECT DISTINCT name, department, city, type, quota, ranking, minRanking 
             FROM universities 
             WHERE name LIKE '%BEZMIALEM%' OR name LIKE '%Bezmialem%'
             ORDER BY department`
        );
        
        console.log(`✅ ${rows.length} Bezmialem kaydı bulundu\n`);
        
        if (rows.length > 0) {
            rows.forEach((row, i) => {
                console.log(`${i+1}. ${row.name}`);
                console.log(`   Bölüm: ${row.department}`);
                console.log(`   Şehir: ${row.city}`);
                console.log(`   Tür: ${row.type}`);
                console.log(`   Kontenjan: ${row.quota}`);
                console.log(`   Sıralama: ${row.ranking || row.minRanking}`);
                console.log('');
            });
        } else {
            console.log('❌ Bezmialem veritabanında bulunamadı!');
            console.log('\nBilgisayar Programcılığı olan vakıf üniversiteleri:');
            const [vakif] = await pool.query(
                `SELECT DISTINCT name, city, quota, ranking, minRanking 
                 FROM universities 
                 WHERE department LIKE '%Bilgisayar Programcılığı%' 
                 AND (type = 'Vakıf' OR type = 'VAKIF' OR type = 'Özel')
                 ORDER BY ranking
                 LIMIT 10`
            );
            vakif.forEach(v => {
                console.log(`  - ${v.name} (${v.city}) - Sıralama: ${v.ranking || v.minRanking}`);
            });
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Hata:', error.message);
        process.exit(1);
    }
}

checkBezmialem();
