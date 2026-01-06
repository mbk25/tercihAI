const { pool } = require('./db');

async function fixProgramTypes() {
    console.log('🔧 Program Türlerini Düzeltme\n');
    console.log('='.repeat(80));
    
    try {
        const connection = await pool.getConnection();
        
        // Önlisans (2 yıllık) programların listesi
        const onlisansPrograms = [
            'Bilgisayar Programcılığı',
            'Web Tasarım ve Kodlama',
            'Bilgisayar Teknolojisi',
            'Bilişim Teknolojileri',
            'İnternet ve Ağ Teknolojileri',
            'Yazılım Geliştirme',
            'Veri Tabanı Programcılığı',
            'Mobil Programcılık',
            'Oyun Programcılığı'
        ];
        
        console.log('📝 Önlisans olarak işaretlenecek programlar:');
        onlisansPrograms.forEach((prog, idx) => {
            console.log(`   ${idx + 1}. ${prog}`);
        });
        console.log('');
        
        let totalUpdated = 0;
        
        for (const program of onlisansPrograms) {
            const [result] = await connection.query(`
                UPDATE universities 
                SET programType = 'Önlisans'
                WHERE department LIKE ?
                AND programType = 'Lisans'
            `, [`%${program}%`]);
            
            if (result.affectedRows > 0) {
                console.log(`✅ "${program}": ${result.affectedRows} program güncellendi`);
                totalUpdated += result.affectedRows;
            }
        }
        
        console.log('\n' + '='.repeat(80));
        console.log(`✅ Toplam ${totalUpdated} program Önlisans olarak güncellendi!`);
        
        // Kontrol et
        const [checkResult] = await connection.query(`
            SELECT COUNT(*) as total, programType
            FROM universities 
            WHERE department LIKE '%Bilgisayar Programc%'
            GROUP BY programType
        `);
        
        console.log('\n📊 Güncellenmiş Durum:');
        checkResult.forEach(row => {
            console.log(`   ${row.programType}: ${row.total} program`);
        });
        
        connection.release();
        
    } catch (error) {
        console.error('❌ Hata:', error);
    }
    
    process.exit(0);
}

fixProgramTypes();
