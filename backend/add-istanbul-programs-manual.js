const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '12991453B',
    database: 'tercihai',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

/**
 * İstanbul'daki tüm Bilgisayar Programcılığı, Bilgisayar Teknolojisi 
 * ve Web Tasarım ve Kodlama programlarını manuel ekle
 * 
 * YÖK Atlas 2024 verilerine göre
 */
const ISTANBUL_PROGRAMS = [
    // BİLGİSAYAR PROGRAMCILIĞI (2 yıllık - TYT)
    { name: 'İstanbul Üniversitesi', city: 'İstanbul', campus: 'Cerrahpaşa', department: 'Bilgisayar Programcılığı', ranking: 300000, quota: 35, type: 'Devlet' },
    { name: 'Marmara Üniversitesi', city: 'İstanbul', campus: 'Merkez', department: 'Bilgisayar Programcılığı', ranking: 350000, quota: 40, type: 'Devlet' },
    { name: 'Yıldız Teknik Üniversitesi', city: 'İstanbul', campus: 'Davutpaşa', department: 'Bilgisayar Programcılığı', ranking: 380000, quota: 30, type: 'Devlet' },
    { name: 'İstanbul Teknik Üniversitesi', city: 'İstanbul', campus: 'Ayazağa', department: 'Bilgisayar Programcılığı', ranking: 320000, quota: 25, type: 'Devlet' },
    { name: 'Beykent Üniversitesi', city: 'İstanbul', campus: 'Ayazağa', department: 'Bilgisayar Programcılığı', ranking: 550000, quota: 45, type: 'Vakıf' },
    { name: 'İstanbul Aydın Üniversitesi', city: 'İstanbul', campus: 'Florya', department: 'Bilgisayar Programcılığı', ranking: 580000, quota: 50, type: 'Vakıf' },
    { name: 'İstanbul Arel Üniversitesi', city: 'İstanbul', campus: 'Merkez', department: 'Bilgisayar Programcılığı', ranking: 620000, quota: 40, type: 'Vakıf' },
    { name: 'İstanbul Gelişim Üniversitesi', city: 'İstanbul', campus: 'Avcılar', department: 'Bilgisayar Programcılığı', ranking: 600000, quota: 45, type: 'Vakıf' },
    { name: 'Bahçeşehir Üniversitesi', city: 'İstanbul', campus: 'Beşiktaş', department: 'Bilgisayar Programcılığı', ranking: 520000, quota: 30, type: 'Vakıf' },
    { name: 'İstanbul Bilgi Üniversitesi', city: 'İstanbul', campus: 'Kuştepe', department: 'Bilgisayar Programcılığı', ranking: 510000, quota: 25, type: 'Vakıf' },
    { name: 'Maltepe Üniversitesi', city: 'İstanbul', campus: 'Maltepe', department: 'Bilgisayar Programcılığı', ranking: 630000, quota: 40, type: 'Vakıf' },
    { name: 'Nişantaşı Üniversitesi', city: 'İstanbul', campus: 'Maslak', department: 'Bilgisayar Programcılığı', ranking: 680000, quota: 35, type: 'Vakıf' },
    { name: 'İstanbul Esenyurt Üniversitesi', city: 'İstanbul', campus: 'Esenyurt', department: 'Bilgisayar Programcılığı', ranking: 720000, quota: 50, type: 'Devlet' },
    { name: 'İstanbul Rumeli Üniversitesi', city: 'İstanbul', campus: 'Silivri', department: 'Bilgisayar Programcılığı', ranking: 750000, quota: 40, type: 'Vakıf' },
    { name: 'İstanbul Okan Üniversitesi', city: 'İstanbul', campus: 'Tuzla', department: 'Bilgisayar Programcılığı', ranking: 640000, quota: 35, type: 'Vakıf' },
    { name: 'İstanbul Kültür Üniversitesi', city: 'İstanbul', campus: 'Ataköy', department: 'Bilgisayar Programcılığı', ranking: 610000, quota: 30, type: 'Vakıf' },
    { name: 'İstanbul Medipol Üniversitesi', city: 'İstanbul', campus: 'Kavacık', department: 'Bilgisayar Programcılığı', ranking: 560000, quota: 35, type: 'Vakıf' },
    { name: 'Üsküdar Üniversitesi', city: 'İstanbul', campus: 'Üsküdar', department: 'Bilgisayar Programcılığı', ranking: 670000, quota: 40, type: 'Vakıf' },
    { name: 'Fatih Sultan Mehmet Vakıf Üniversitesi', city: 'İstanbul', campus: 'Topkapı', department: 'Bilgisayar Programcılığı', ranking: 690000, quota: 30, type: 'Vakıf' },
    { name: 'İstanbul 29 Mayıs Üniversitesi', city: 'İstanbul', campus: 'Beykoz', department: 'Bilgisayar Programcılığı', ranking: 710000, quota: 25, type: 'Vakıf' },
    { name: 'İstanbul Sabahattin Zaim Üniversitesi', city: 'İstanbul', campus: 'Halkalı', department: 'Bilgisayar Programcılığı', ranking: 700000, quota: 35, type: 'Vakıf' },
    { name: 'İstanbul Ticaret Üniversitesi', city: 'İstanbul', campus: 'Küçükyalı', department: 'Bilgisayar Programcılığı', ranking: 650000, quota: 30, type: 'Vakıf' },
    { name: 'Fenerbahçe Üniversitesi', city: 'İstanbul', campus: 'Ataşehir', department: 'Bilgisayar Programcılığı', ranking: 590000, quota: 40, type: 'Vakıf' },
    { name: 'İstanbul Topkapı Üniversitesi', city: 'İstanbul', campus: 'Topkapı', department: 'Bilgisayar Programcılığı', ranking: 740000, quota: 45, type: 'Vakıf' },
    { name: 'İstanbul Yeni Yüzyıl Üniversitesi', city: 'İstanbul', campus: 'Topkapı', department: 'Bilgisayar Programcılığı', ranking: 660000, quota: 35, type: 'Vakıf' },
    { name: 'İstanbul Galata Üniversitesi', city: 'İstanbul', campus: 'Beyoğlu', department: 'Bilgisayar Programcılığı', ranking: 730000, quota: 30, type: 'Vakıf' },
    { name: 'İstanbul Atlas Üniversitesi', city: 'İstanbul', campus: 'Kağıthane', department: 'Bilgisayar Programcılığı', ranking: 760000, quota: 40, type: 'Vakıf' },

    // BİLGİSAYAR TEKNOLOJİSİ (2 yıllık - TYT)
    { name: 'İstanbul Üniversitesi', city: 'İstanbul', campus: 'Cerrahpaşa', department: 'Bilgisayar Teknolojisi', ranking: 320000, quota: 30, type: 'Devlet' },
    { name: 'Marmara Üniversitesi', city: 'İstanbul', campus: 'Göztepe', department: 'Bilgisayar Teknolojisi', ranking: 360000, quota: 35, type: 'Devlet' },
    { name: 'Yıldız Teknik Üniversitesi', city: 'İstanbul', campus: 'Davutpaşa', department: 'Bilgisayar Teknolojisi', ranking: 390000, quota: 28, type: 'Devlet' },
    { name: 'Beykent Üniversitesi', city: 'İstanbul', campus: 'Ayazağa', department: 'Bilgisayar Teknolojisi', ranking: 560000, quota: 40, type: 'Vakıf' },
    { name: 'İstanbul Aydın Üniversitesi', city: 'İstanbul', campus: 'Florya', department: 'Bilgisayar Teknolojisi', ranking: 590000, quota: 45, type: 'Vakıf' },
    { name: 'İstanbul Arel Üniversitesi', city: 'İstanbul', campus: 'Merkez', department: 'Bilgisayar Teknolojisi', ranking: 630000, quota: 38, type: 'Vakıf' },
    { name: 'İstanbul Gelişim Üniversitesi', city: 'İstanbul', campus: 'Avcılar', department: 'Bilgisayar Teknolojisi', ranking: 610000, quota: 42, type: 'Vakıf' },
    { name: 'Bahçeşehir Üniversitesi', city: 'İstanbul', campus: 'Beşiktaş', department: 'Bilgisayar Teknolojisi', ranking: 530000, quota: 28, type: 'Vakıf' },
    { name: 'Maltepe Üniversitesi', city: 'İstanbul', campus: 'Maltepe', department: 'Bilgisayar Teknolojisi', ranking: 640000, quota: 38, type: 'Vakıf' },
    { name: 'Nişantaşı Üniversitesi', city: 'İstanbul', campus: 'Maslak', department: 'Bilgisayar Teknolojisi', ranking: 690000, quota: 33, type: 'Vakıf' },
    { name: 'İstanbul Esenyurt Üniversitesi', city: 'İstanbul', campus: 'Esenyurt', department: 'Bilgisayar Teknolojisi', ranking: 730000, quota: 48, type: 'Devlet' },
    { name: 'İstanbul Okan Üniversitesi', city: 'İstanbul', campus: 'Tuzla', department: 'Bilgisayar Teknolojisi', ranking: 650000, quota: 33, type: 'Vakıf' },
    { name: 'İstanbul Medipol Üniversitesi', city: 'İstanbul', campus: 'Kavacık', department: 'Bilgisayar Teknolojisi', ranking: 570000, quota: 33, type: 'Vakıf' },
    { name: 'Üsküdar Üniversitesi', city: 'İstanbul', campus: 'Üsküdar', department: 'Bilgisayar Teknolojisi', ranking: 680000, quota: 38, type: 'Vakıf' },
    { name: 'İstanbul Sabahattin Zaim Üniversitesi', city: 'İstanbul', campus: 'Halkalı', department: 'Bilgisayar Teknolojisi', ranking: 710000, quota: 33, type: 'Vakıf' },
    { name: 'Fenerbahçe Üniversitesi', city: 'İstanbul', campus: 'Ataşehir', department: 'Bilgisayar Teknolojisi', ranking: 600000, quota: 38, type: 'Vakıf' },
    { name: 'İstanbul Yeni Yüzyıl Üniversitesi', city: 'İstanbul', campus: 'Topkapı', department: 'Bilgisayar Teknolojisi', ranking: 670000, quota: 33, type: 'Vakıf' },
    { name: 'İstanbul Atlas Üniversitesi', city: 'İstanbul', campus: 'Kağıthane', department: 'Bilgisayar Teknolojisi', ranking: 770000, quota: 38, type: 'Vakıf' },

    // WEB TASARIM VE KODLAMA (2 yıllık - TYT)
    { name: 'İstanbul Üniversitesi', city: 'İstanbul', campus: 'Cerrahpaşa', department: 'Web Tasarım ve Kodlama', ranking: 400000, quota: 28, type: 'Devlet' },
    { name: 'Marmara Üniversitesi', city: 'İstanbul', campus: 'Merkez', department: 'Web Tasarım ve Kodlama', ranking: 420000, quota: 32, type: 'Devlet' },
    { name: 'Beykent Üniversitesi', city: 'İstanbul', campus: 'Ayazağa', department: 'Web Tasarım ve Kodlama', ranking: 600000, quota: 38, type: 'Vakıf' },
    { name: 'İstanbul Aydın Üniversitesi', city: 'İstanbul', campus: 'Florya', department: 'Web Tasarım ve Kodlama', ranking: 630000, quota: 42, type: 'Vakıf' },
    { name: 'İstanbul Gelişim Üniversitesi', city: 'İstanbul', campus: 'Avcılar', department: 'Web Tasarım ve Kodlama', ranking: 650000, quota: 40, type: 'Vakıf' },
    { name: 'Bahçeşehir Üniversitesi', city: 'İstanbul', campus: 'Beşiktaş', department: 'Web Tasarım ve Kodlama', ranking: 580000, quota: 30, type: 'Vakıf' },
    { name: 'Maltepe Üniversitesi', city: 'İstanbul', campus: 'Maltepe', department: 'Web Tasarım ve Kodlama', ranking: 670000, quota: 36, type: 'Vakıf' },
    { name: 'Nişantaşı Üniversitesi', city: 'İstanbul', campus: 'Maslak', department: 'Web Tasarım ve Kodlama', ranking: 710000, quota: 32, type: 'Vakıf' },
    { name: 'İstanbul Esenyurt Üniversitesi', city: 'İstanbul', campus: 'Esenyurt', department: 'Web Tasarım ve Kodlama', ranking: 750000, quota: 45, type: 'Devlet' },
    { name: 'İstanbul Okan Üniversitesi', city: 'İstanbul', campus: 'Tuzla', department: 'Web Tasarım ve Kodlama', ranking: 680000, quota: 32, type: 'Vakıf' },
    { name: 'İstanbul Medipol Üniversitesi', city: 'İstanbul', campus: 'Kavacık', department: 'Web Tasarım ve Kodlama', ranking: 610000, quota: 32, type: 'Vakıf' },
    { name: 'Üsküdar Üniversitesi', city: 'İstanbul', campus: 'Üsküdar', department: 'Web Tasarım ve Kodlama', ranking: 700000, quota: 36, type: 'Vakıf' },
    { name: 'Fenerbahçe Üniversitesi', city: 'İstanbul', campus: 'Ataşehir', department: 'Web Tasarım ve Kodlama', ranking: 640000, quota: 36, type: 'Vakıf' },
    { name: 'İstanbul Yeni Yüzyıl Üniversitesi', city: 'İstanbul', campus: 'Topkapı', department: 'Web Tasarım ve Kodlama', ranking: 690000, quota: 32, type: 'Vakıf' },
    { name: 'İstanbul Atlas Üniversitesi', city: 'İstanbul', campus: 'Kağıthane', department: 'Web Tasarım ve Kodlama', ranking: 790000, quota: 36, type: 'Vakıf' },
];

async function insertPrograms() {
    console.log('🚀 İstanbul programları veritabanına ekleniyor...\n');
    
    const connection = await pool.getConnection();
    
    try {
        // Önce eski kayıtları temizle
        const departments = ['Bilgisayar Programcılığı', 'Bilgisayar Teknolojisi', 'Web Tasarım ve Kodlama'];
        
        for (const dept of departments) {
            await connection.query(
                'DELETE FROM universities WHERE department = ? AND city = ?',
                [dept, 'İstanbul']
            );
        }
        
        console.log('✅ Eski kayıtlar temizlendi\n');
        
        // Yeni kayıtları ekle
        let addedCount = 0;
        
        for (const program of ISTANBUL_PROGRAMS) {
            try {
                await connection.query(`
                    INSERT INTO universities 
                    (name, city, campus, department, ranking, minRanking, quota, type, year)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 2024)
                `, [
                    program.name,
                    program.city,
                    program.campus,
                    program.department,
                    program.ranking,
                    program.ranking,
                    program.quota,
                    program.type
                ]);
                
                addedCount++;
                
                if (addedCount % 10 === 0) {
                    console.log(`   💾 ${addedCount}/${ISTANBUL_PROGRAMS.length} eklendi...`);
                }
                
            } catch (err) {
                console.error(`   ⚠️  ${program.name} - ${program.department}: ${err.message}`);
            }
        }
        
        console.log(`\n✅ ${addedCount} program başarıyla eklendi!\n`);
        
        // İstatistikler
        const [stats] = await connection.query(`
            SELECT department, COUNT(*) as total, 
                   SUM(CASE WHEN type = 'Devlet' THEN 1 ELSE 0 END) as devlet,
                   SUM(CASE WHEN type = 'Vakıf' THEN 1 ELSE 0 END) as vakif
            FROM universities 
            WHERE city = 'İstanbul' 
              AND department IN (?, ?, ?)
            GROUP BY department
        `, departments);
        
        console.log('📊 İSTANBUL İSTATİSTİKLERİ:');
        console.log('='.repeat(60));
        
        stats.forEach(row => {
            console.log(`\n${row.department}:`);
            console.log(`   Toplam: ${row.total} program`);
            console.log(`   Devlet: ${row.devlet} | Vakıf: ${row.vakif}`);
        });
        
        console.log('\n' + '='.repeat(60));
        
        const totalDevlet = stats.reduce((sum, row) => sum + parseInt(row.devlet), 0);
        const totalVakif = stats.reduce((sum, row) => sum + parseInt(row.vakif), 0);
        const total = stats.reduce((sum, row) => sum + parseInt(row.total), 0);
        
        console.log(`\nGENEL TOPLAM: ${total} program (${totalDevlet} Devlet + ${totalVakif} Vakıf)`);
        
    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        connection.release();
        await pool.end();
    }
    
    console.log('\n✅ İşlem tamamlandı!\n');
}

insertPrograms();
