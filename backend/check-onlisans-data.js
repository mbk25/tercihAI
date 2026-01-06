const { pool } = require('./db');

async function checkOnlisansData() {
    console.log('🔍 Önlisans Programları Kontrolü\n');
    console.log('='.repeat(80));
    
    try {
        const connection = await pool.getConnection();
        
        // Bilgisayar Programcılığı say
        const [countResult] = await connection.query(`
            SELECT COUNT(*) as total, type, programType
            FROM universities 
            WHERE department LIKE '%Bilgisayar Programc%' 
            GROUP BY type, programType
        `);
        
        console.log('\n📊 Bilgisayar Programcılığı - İstatistikler:');
        countResult.forEach(row => {
            console.log(`   ${row.type} ${row.programType}: ${row.total} program`);
        });
        
        // İstanbul'daki önlisans programları
        const [istanbulResult] = await connection.query(`
            SELECT name, city, type, ranking, department, programType
            FROM universities 
            WHERE department LIKE '%Bilgisayar Programc%'
            AND city = 'İstanbul'
            AND programType = 'Önlisans'
            ORDER BY ranking ASC
            LIMIT 10
        `);
        
        console.log('\n📍 İstanbul - Bilgisayar Programcılığı Önlisans (İlk 10):');
        console.log('='.repeat(80));
        istanbulResult.forEach((row, index) => {
            console.log(`${index + 1}. ${row.name}`);
            console.log(`   Tür: ${row.type}, Taban Sıralama: ${row.ranking || 'Bilinmiyor'}`);
            console.log(`   Program Türü: ${row.programType}`);
            console.log('-'.repeat(80));
        });
        
        // TYT 400.000 altındaki programlar (kullanıcının sıralaması)
        const [eligibleResult] = await connection.query(`
            SELECT name, city, type, ranking
            FROM universities 
            WHERE department LIKE '%Bilgisayar Programc%'
            AND city = 'İstanbul'
            AND programType = 'Önlisans'
            AND ranking >= 400000
            ORDER BY ranking ASC
            LIMIT 10
        `);
        
        console.log('\n✅ TYT 400.000 ile girebilecek programlar:');
        console.log('='.repeat(80));
        if (eligibleResult.length > 0) {
            eligibleResult.forEach((row, index) => {
                console.log(`${index + 1}. ${row.name} (${row.type})`);
                console.log(`   Taban Sıralama: ${row.ranking}`);
                console.log('-'.repeat(80));
            });
        } else {
            console.log('❌ Bu sıralama ile girebileceğiniz program bulunamadı.');
            console.log('   Not: Daha düşük sıralamaya sahip programlar var.');
        }
        
        connection.release();
        
    } catch (error) {
        console.error('❌ Hata:', error);
    }
    
    process.exit(0);
}

checkOnlisansData();
