const { pool } = require('./db');

async function testConditions() {
    const conn = await pool.getConnection();
    
    try {
        // Yıldız Teknik Üniversitesi - Bilgisayar Mühendisliği için şartları çek
        const [rows] = await conn.query(`
            SELECT pc.universityName, pc.programName, pc.conditionNumber, cd.conditionText, pc.city, pc.campus
            FROM program_conditions pc 
            LEFT JOIN condition_definitions cd ON pc.conditionNumber = cd.conditionNumber
            WHERE pc.universityName LIKE '%Yıldız%' AND pc.programName LIKE '%Bilgisayar%'
            ORDER BY pc.conditionNumber
        `);
        
        console.log('🎯 Yıldız Teknik Üniversitesi - Bilgisayar Mühendisliği:');
        if (rows.length > 0) {
            rows.forEach(r => {
                console.log(`  📋 Madde ${r.conditionNumber}: ${r.conditionText || 'Tanım bulunamadı'}`);
            });
        } else {
            console.log('  ❌ Bu üniversite için şart bulunamadı');
        }

        // Genel bir kontrol - hangi üniversiteler var?
        const [universities] = await conn.query(`
            SELECT DISTINCT universityName 
            FROM program_conditions 
            WHERE programName LIKE '%Bilgisayar Mühendisliği%' 
            ORDER BY universityName 
            LIMIT 10
        `);
        
        console.log('\n🏛️ Bilgisayar Mühendisliği olan üniversiteler:');
        universities.forEach(u => {
            console.log(`  - ${u.universityName}`);
        });

        // Şart tanımlarını kontrol et
        const [definitions] = await conn.query(`
            SELECT conditionNumber, conditionText 
            FROM condition_definitions 
            ORDER BY conditionNumber 
            LIMIT 10
        `);
        
        console.log('\n📋 Şart tanımları:');
        definitions.forEach(d => {
            console.log(`  Madde ${d.conditionNumber}: ${d.conditionText.substring(0, 80)}...`);
        });
        
    } finally {
        conn.release();
    }
}

testConditions().catch(console.error);