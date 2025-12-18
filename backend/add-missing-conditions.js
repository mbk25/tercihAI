/**
 * Eksik Şartları Otomatik Tamamlama Script'i
 * 
 * Bu script universities tablosundaki TÜM üniversiteleri tarar
 * ve şartı olmayan her üniversite için varsayılan şart atar
 */

const { pool } = require('./db');

async function addMissingConditions() {
    const connection = await pool.getConnection();
    
    try {
        console.log('🔍 Şartı olmayan üniversiteler aranıyor...\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // Varsayılan şartlar
        const defaultConditions = {
            'Devlet': ['18'],           // Normal öğretim
            'Vakıf': ['16', '17', '24']  // Ücretli + Kısmi burs
        };
        
        // 1. Tüm üniversiteleri bul (universities tablosundan)
        const [allUniversities] = await connection.query(`
            SELECT DISTINCT 
                name, 
                department, 
                city, 
                campus,
                type
            FROM universities 
            WHERE year = 2024
            ORDER BY name, department
        `);
        
        console.log(`📊 Toplam ${allUniversities.length} üniversite-program kombinasyonu bulundu\n`);
        
        // 2. Her üniversite için şart kontrolü yap
        let missingCount = 0;
        let existingCount = 0;
        let addedCount = 0;
        let errorCount = 0;
        
        const missingList = [];
        
        for (const uni of allUniversities) {
            // Bu üniversite-program için şart var mı?
            const [existing] = await connection.query(`
                SELECT COUNT(*) as count 
                FROM program_conditions 
                WHERE universityName = ? 
                AND programName = ? 
                AND year = 2024
            `, [uni.name, uni.department]);
            
            if (existing[0].count === 0) {
                missingCount++;
                missingList.push(uni);
            } else {
                existingCount++;
            }
        }
        
        console.log(`✅ Şartı olan: ${existingCount}`);
        console.log(`❌ Şartı olmayan: ${missingCount}\n`);
        
        if (missingCount === 0) {
            console.log('✨ Tüm üniversitelerin şartı mevcut! Ekleme gerekmiyor.\n');
            return;
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🔄 ${missingCount} üniversite için şart ekleniyor...\n`);
        
        // 3. Eksik olanlara şart ekle
        for (const uni of missingList) {
            try {
                // Üniversite türüne göre varsayılan şartları al
                const conditions = defaultConditions[uni.type] || defaultConditions['Devlet'];
                const code = `AUTO${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
                
                // Her şart için kayıt ekle
                for (const condNum of conditions) {
                    await connection.query(`
                        INSERT IGNORE INTO program_conditions 
                        (universityCode, universityName, programCode, programName, city, campus, conditionNumber, type, year)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 2024)
                    `, [code, uni.name, code, uni.department, uni.city, uni.campus || 'Merkez', condNum, uni.type]);
                }
                
                addedCount++;
                console.log(`✅ ${uni.name} - ${uni.department}`);
                console.log(`   ${uni.type} → Madde ${conditions.join(', ')}`);
                
            } catch (error) {
                errorCount++;
                console.error(`❌ ${uni.name} - ${uni.department}`);
                console.error(`   Hata: ${error.message}`);
            }
        }
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 İSTATİSTİKLER:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   Toplam üniversite: ${allUniversities.length}`);
        console.log(`   Zaten şartı olan: ${existingCount}`);
        console.log(`   Şart eklendi: ${addedCount}`);
        console.log(`   Hata: ${errorCount}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // 4. Doğrulama yap
        console.log('✅ Doğrulama yapılıyor...\n');
        
        const [finalMissing] = await connection.query(`
            SELECT COUNT(DISTINCT u.name, u.department) as count
            FROM universities u
            LEFT JOIN program_conditions pc 
                ON u.name = pc.universityName 
                AND u.department = pc.programName
                AND pc.year = 2024
            WHERE u.year = 2024
            AND pc.id IS NULL
        `);
        
        if (finalMissing[0].count === 0) {
            console.log('✅ BAŞARILI! Tüm üniversitelerin şartı mevcut.\n');
        } else {
            console.log(`⚠️  Hala ${finalMissing[0].count} üniversitenin şartı eksik.\n`);
            console.log('💡 Script\'i tekrar çalıştırın veya manuel kontrol edin.\n');
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✨ İşlem tamamlandı!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('💡 Sunucuyu yeniden başlatın: node server.js\n');
        
    } catch (error) {
        console.error('❌ Kritik hata:', error);
        console.error('\n💡 Veritabanı bağlantısını kontrol edin.');
    } finally {
        connection.release();
        process.exit(0);
    }
}

// Script'i çalıştır
if (require.main === module) {
    addMissingConditions();
}

module.exports = { addMissingConditions };
