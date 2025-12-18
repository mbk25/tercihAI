const {pool} = require('./db');

async function testScrapeYokAtlas() {
    const department = "Bilgisayar Programcılığı";
    const year = 2024;
    
    console.log(`\n🔍 Testing scrapeYokAtlas("${department}", ${year})\n`);
    
    try {
        const connection = await pool.getConnection();
        
        let [dbData] = await connection.query(
            'SELECT * FROM universities WHERE department = ? AND year = ? ORDER BY COALESCE(ranking, 999999) DESC',
            [department, year]
        );
        
        console.log(`✅ Veritabanı sorgusu tamamlandı`);
        console.log(`📊 Bulunan kayıt sayısı: ${dbData.length}\n`);
        
        if (dbData.length > 0) {
            console.log('İlk 5 kayıt:');
            dbData.slice(0, 5).forEach((row, i) => {
                console.log(`${i + 1}. ${row.name}`);
                console.log(`   city: "${row.city}"`);
                console.log(`   ranking: ${row.ranking}`);
                console.log(`   type: ${row.type}\n`);
            });
            
            // İstanbul filtresi test et
            console.log('🔍 İstanbul filtresi testi:\n');
            
            const city = "İstanbul";
            const selectedCities = city.split(',').map(c => c.trim().toLocaleLowerCase('tr-TR'));
            console.log(`Selected cities (lowercase): ${selectedCities.join(', ')}\n`);
            
            const filteredUnis = dbData.filter(uni => {
                if (!uni.city) {
                    console.log(`   ❌ ${uni.name}: city is null/undefined`);
                    return false;
                }
                const uniCity = uni.city.toLocaleLowerCase('tr-TR');
                const match = selectedCities.some(sc => uniCity.includes(sc) || uniCity.includes(sc.replace('i', 'İ')));
                
                if (match) {
                    console.log(`   ✅ ${uni.name}: "${uni.city}" -> "${uniCity}" MATCH!`);
                } else {
                    console.log(`   ⚠️  ${uni.name}: "${uni.city}" -> "${uniCity}" NO MATCH`);
                }
                
                return match;
            });
            
            console.log(`\n📍 Filtre sonrası: ${filteredUnis.length} üniversite\n`);
            
            if (filteredUnis.length > 0) {
                console.log('Filtrelenmiş ilk 5:');
                filteredUnis.slice(0, 5).forEach((u, i) => {
                    console.log(`${i + 1}. ${u.name} (${u.city}) - ${u.ranking}`);
                });
            }
        }
        
        connection.release();
        await pool.end();
        
    } catch (error) {
        console.error('❌ Hata:', error.message);
        process.exit(1);
    }
}

testScrapeYokAtlas();
