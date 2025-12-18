const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '12991453B',
    database: 'tercihai'
});

async function testScraper() {
    const department = "Bilgisayar Programcılığı";
    const year = 2024;
    
    const connection = await pool.getConnection();
    
    // Tam eşleşme
    let [dbData] = await connection.query(
        'SELECT * FROM universities WHERE department = ? AND year = ? ORDER BY COALESCE(ranking, 999999) ASC',
        [department, year]
    );
    
    console.log(`\n📚 Veritabanı Sorgusu: "${department}"`);
    console.log(`   Bulunan: ${dbData.length} kayıt\n`);
    
    if (dbData.length > 0) {
        console.log('İlk 10 Kayıt:');
        dbData.slice(0, 10).forEach((row, i) => {
            console.log(`${i + 1}. ${row.name} (${row.city}) - Taban: ${row.ranking || row.minRanking} - ${row.type}`);
        });
        
        // İstanbul filtresi
        console.log('\n🔍 City değerleri:');
        dbData.slice(0, 5).forEach(u => console.log(`   ${u.name}: city="${u.city}"`));
        
        const istanbul = dbData.filter(u => {
            if (!u.city) return false;
            const cityLower = u.city.toLocaleLowerCase('tr-TR');
            const match = cityLower.includes('istanbul') || cityLower.includes('İstanbul');
            return match;
        });
        console.log(`\n📍 İstanbul: ${istanbul.length} kayıt`);
        
        // 450k ile girebilecekler (TYT)
        const eligible = istanbul.filter(u => {
            const rank = u.ranking || u.minRanking || 0;
            return rank > 0 && 450000 <= rank;
        });
        
        console.log(`✅ TYT 450k ile girebilir: ${eligible.length} üniversite\n`);
        
        if (eligible.length > 0) {
            console.log('Girebilecek Üniversiteler:');
            eligible.forEach((u, i) => {
                console.log(`${i + 1}. ${u.name} - Taban: ${u.ranking || u.minRanking}`);
            });
        }
    } else {
        console.log('❌ Veritabanında kayıt bulunamadı!');
        
        // Tüm bölümleri listele
        const [all] = await connection.query(
            'SELECT DISTINCT department FROM universities ORDER BY department'
        );
        console.log('\nVeritabanındaki bölümler:');
        all.forEach(row => console.log(`   - ${row.department}`));
    }
    
    connection.release();
    await pool.end();
}

testScraper();
