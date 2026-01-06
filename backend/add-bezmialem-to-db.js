const { pool } = require('./db');

async function addBezmialem() {
    console.log('➕ Bezmialem Vakıf Üniversitesi veritabanına ekleniyor...\n');
    
    try {
        // Bezmialem Vakıf Üniversitesi - Bilgisayar Programcılığı
        // ÖSYM 2024 verileri
        const bezmialemPrograms = [
            {
                name: 'Bezmialem Vakıf Üniversitesi',
                department: 'Bilgisayar Programcılığı',
                city: 'İstanbul',
                type: 'Vakıf',
                programType: 'Önlisans',
                campus: 'Merkez Kampüs',
                quota: 30,
                ranking: 550000,
                minRanking: 550000,
                year: 2024
            }
        ];
        
        for (const program of bezmialemPrograms) {
            await pool.query(
                `INSERT INTO universities 
                 (name, department, city, type, programType, campus, quota, ranking, minRanking, year)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    program.name, program.department, program.city, program.type, program.programType,
                    program.campus, program.quota, program.ranking, program.minRanking, program.year
                ]
            );
            
            console.log(`✅ Eklendi: ${program.name} - ${program.department}`);
        }
        
        console.log('\n🎉 Bezmialem başarıyla veritabanına eklendi!');
        console.log('\nKontrol ediliyor...\n');
        
        const [rows] = await pool.query(
            `SELECT * FROM universities WHERE name LIKE '%Bezmialem%'`
        );
        
        rows.forEach(row => {
            console.log(`✅ ${row.name} - ${row.department}`);
            console.log(`   Şehir: ${row.city}, Tür: ${row.type}`);
            console.log(`   Sıralama: ${row.ranking}, Kontenjan: ${row.quota}\n`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Hata:', error.message);
        console.error(error);
        process.exit(1);
    }
}

addBezmialem();
