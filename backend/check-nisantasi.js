const { pool } = require('./db');

async function checkNisantasi() {
    console.log('🔍 Nişantaşı Üniversitesi - Bilgisayar Programcılığı\n');
    
    try {
        const connection = await pool.getConnection();
        
        // MySQL'de ara
        const [result] = await connection.query(`
            SELECT name, department, city, campus, type, ranking, programType
            FROM universities 
            WHERE name LIKE '%Nişantaşı%' 
            AND department LIKE '%Bilgisayar Programc%'
            LIMIT 5
        `);
        
        console.log(`Bulunan program sayısı: ${result.length}\n`);
        
        result.forEach((row, index) => {
            console.log(`${index + 1}. ${row.name}`);
            console.log(`   Bölüm: ${row.department}`);
            console.log(`   Şehir: ${row.city}`);
            console.log(`   Kampüs: ${row.campus || 'Belirtilmemiş'}`);
            console.log(`   Tür: ${row.type}`);
            console.log(`   Program Türü: ${row.programType}`);
            console.log(`   Sıralama: ${row.ranking || 'Bilinmiyor'}`);
            console.log('');
        });
        
        connection.release();
        
    } catch (error) {
        console.error('❌ Hata:', error);
    }
    
    process.exit(0);
}

checkNisantasi();
