/**
 * Veritabanına programType sütunu ekler
 * Önlisans ve Lisans programlarını ayırt etmek için
 */

const { pool } = require('./db');

async function addProgramTypeColumn() {
    console.log('🔧 Veritabanı şeması güncelleniyor...\n');
    
    try {
        // Önce sütunun var olup olmadığını kontrol et
        const [columns] = await pool.query(`
            SHOW COLUMNS FROM universities LIKE 'programType'
        `);
        
        if (columns.length === 0) {
            // programType sütununu ekle
            await pool.query(`
                ALTER TABLE universities 
                ADD COLUMN programType ENUM('Lisans', 'Önlisans') DEFAULT 'Lisans'
                AFTER department
            `);
            
            console.log('✅ programType sütunu eklendi');
        } else {
            console.log('ℹ️  programType sütunu zaten mevcut');
        }
        
        // Index ekle (varsa hata vermez)
        try {
            await pool.query(`
                CREATE INDEX idx_programType ON universities(programType)
            `);
            console.log('✅ programType index eklendi');
        } catch (err) {
            if (err.message.includes('Duplicate key name')) {
                console.log('ℹ️  programType index zaten mevcut');
            } else {
                throw err;
            }
        }
        
        // Mevcut kayıtları güncelle (varsayılan olarak Lisans)
        const [result] = await pool.query(`
            UPDATE universities 
            SET programType = 'Lisans' 
            WHERE programType IS NULL
        `);
        
        console.log(`✅ ${result.affectedRows} kayıt güncellendi (Lisans olarak işaretlendi)`);
        
        // Veritabanı yapısını göster
        const [updatedColumns] = await pool.query(`
            SHOW COLUMNS FROM universities LIKE 'programType'
        `);
        
        console.log('\n📊 Yeni sütun yapısı:');
        console.log(updatedColumns[0]);
        
        console.log('\n✅ Veritabanı güncelleme tamamlandı!');
        
    } catch (error) {
        console.error('❌ Hata:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

// Çalıştır
if (require.main === module) {
    addProgramTypeColumn().catch(error => {
        console.error('\n❌ Fatal hata:', error);
        process.exit(1);
    });
}

module.exports = { addProgramTypeColumn };
