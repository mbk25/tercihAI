/**
 * Tekrar Eden ÖSYM Şart Maddelerini Temizleme Script'i
 */

const { pool } = require('./db');

async function fixDuplicateConditions() {
    const connection = await pool.getConnection();
    
    try {
        console.log('🔧 Tekrar eden şart maddelerini temizliyorum...\n');
        
        // 1. Mevcut tekrar edenleri bul
        console.log('📊 Tekrar eden kayıtlar tespit ediliyor...');
        const [duplicates] = await connection.query(`
            SELECT universityName, programName, conditionNumber, COUNT(*) as count
            FROM program_conditions
            WHERE year = 2024
            GROUP BY universityName, programName, conditionNumber
            HAVING count > 1
        `);
        
        console.log(`   ⚠️  ${duplicates.length} adet tekrar eden kayıt bulundu\n`);
        
        if (duplicates.length > 0) {
            console.log('Tekrar edenler:');
            duplicates.forEach(dup => {
                console.log(`   • ${dup.universityName} - ${dup.programName} - Madde ${dup.conditionNumber} (${dup.count}x)`);
            });
            console.log('');
        }
        
        // 2. Geçici tablo oluştur (tekrarsız)
        console.log('🔄 Tekrarsız veri oluşturuluyor...');
        
        await connection.query(`DROP TABLE IF EXISTS program_conditions_temp`);
        
        await connection.query(`
            CREATE TABLE program_conditions_temp LIKE program_conditions
        `);
        
        // 3. Tekrarsız verileri geçici tabloya kopyala
        await connection.query(`
            INSERT INTO program_conditions_temp 
            SELECT MIN(id) as id, 
                   universityCode, 
                   universityName, 
                   programCode, 
                   programName, 
                   city, 
                   campus, 
                   conditionNumber, 
                   conditionText,
                   type, 
                   year, 
                   createdAt, 
                   updatedAt
            FROM program_conditions
            WHERE year = 2024
            GROUP BY universityName, programName, conditionNumber, year
        `);
        
        const [tempCount] = await connection.query(`SELECT COUNT(*) as count FROM program_conditions_temp`);
        console.log(`   ✅ ${tempCount[0].count} tekrarsız kayıt oluşturuldu\n`);
        
        // 4. Eski tabloyu sil, yenisini adlandır
        console.log('🔄 Tablolar güncelleniyor...');
        
        await connection.query(`DROP TABLE program_conditions`);
        await connection.query(`RENAME TABLE program_conditions_temp TO program_conditions`);
        
        // 5. UNIQUE constraint ekle (gelecekte tekrar olmasın)
        console.log('🔒 UNIQUE constraint ekleniyor...');
        
        await connection.query(`
            ALTER TABLE program_conditions
            ADD UNIQUE KEY unique_condition (universityName, programName, conditionNumber, year)
        `);
        
        console.log('   ✅ Constraint eklendi\n');
        
        // 6. Sonuçları doğrula
        console.log('✅ Doğrulama yapılıyor...');
        
        const [finalDuplicates] = await connection.query(`
            SELECT universityName, programName, conditionNumber, COUNT(*) as count
            FROM program_conditions
            WHERE year = 2024
            GROUP BY universityName, programName, conditionNumber
            HAVING count > 1
        `);
        
        if (finalDuplicates.length === 0) {
            console.log('   ✅ Hiç tekrar yok! Tüm şartlar benzersiz.\n');
        } else {
            console.log(`   ⚠️  ${finalDuplicates.length} tekrar hala var (beklenmeyen)\n`);
        }
        
        // 7. İstanbul Arel örneğini göster
        console.log('🔍 İstanbul Arel Üniversitesi kontrol ediliyor...');
        
        const [arelConditions] = await connection.query(`
            SELECT conditionNumber, conditionText
            FROM program_conditions pc
            LEFT JOIN condition_definitions cd ON pc.conditionNumber = cd.conditionNumber
            WHERE pc.universityName LIKE '%Arel%'
            AND pc.year = 2024
            ORDER BY CAST(pc.conditionNumber AS UNSIGNED)
        `);
        
        if (arelConditions.length > 0) {
            console.log('   Şartlar:');
            arelConditions.forEach(cond => {
                console.log(`   • Madde ${cond.conditionNumber}: ${cond.conditionText || 'N/A'}`);
            });
            console.log(`   Toplam: ${arelConditions.length} benzersiz şart\n`);
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ TEMİZLEME TAMAMLANDI!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('💡 Sunucuyu yeniden başlatın: node server.js\n');
        
    } catch (error) {
        console.error('❌ Hata:', error);
        console.error('\n⚠️  Bir sorun oluştu. Veritabanını yedeklediniz mi?');
    } finally {
        connection.release();
        process.exit(0);
    }
}

// Script'i çalıştır
if (require.main === module) {
    fixDuplicateConditions();
}

module.exports = { fixDuplicateConditions };
