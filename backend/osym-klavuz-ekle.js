/**
 * ÖSYM Tercih Kılavuzu - Manuel Veri Ekleme Aracı
 * 
 * Bu script ile ÖSYM kılavuzundan manuel olarak üniversite şartlarını ekleyebilirsiniz.
 * 
 * KULLANIM:
 * 1. ÖSYM'nin resmi kılavuzunu açın: https://www.osym.gov.tr/
 * 2. İlgili bölüm için üniversite listesini bulun
 * 3. Her üniversitenin şart numaralarını aşağıdaki formata göre ekleyin
 * 4. node osym-klavuz-ekle.js komutu ile çalıştırın
 */

const { pool } = require('./db');

/**
 * Üniversite şartlarını toplu olarak ekle
 */
async function addBulkConditions() {
    const connection = await pool.getConnection();
    
    try {
        console.log('📋 ÖSYM Şart Maddelerini Ekleme Aracı\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // GENEL VARSAYILAN ŞARTLAR
        // Eğer bir üniversite için özel şart yoksa, bu genel şartlar kullanılır
        const defaultConditions = {
            'Devlet': ['18'],           // Normal öğretim
            'Devlet-İkinci': ['19'],    // İkinci öğretim
            'Vakıf': ['16', '17', '24'] // Ücretli + Kısmi burs
        };
        
        // TÜM TÜRKİYE ÜNİVERSİTELERİ İÇİN GENEL ŞART SİSTEMİ
        // ÖSYM kılavuzundan eklenmesi gereken özel şartlar:
        const universityConditions = [
            // ==============================
            // MÜHENDİSLİK FAKÜLTELERİ
            // ==============================
            
            // ANKARA - DEVLET
            { uni: 'Ankara Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['13', '18'], type: 'Devlet' },
            { uni: 'ODTÜ', dept: 'Bilgisayar Mühendisliği', conditions: ['14', '12', '5'], type: 'Devlet' },
            { uni: 'Hacettepe Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['13', '18'], type: 'Devlet' },
            { uni: 'Gazi Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['18'], type: 'Devlet' },
            
            // İSTANBUL - DEVLET
            { uni: 'Boğaziçi Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['14', '12'], type: 'Devlet' },
            { uni: 'İstanbul Teknik Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['13', '18'], type: 'Devlet' },
            { uni: 'İstanbul Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['18'], type: 'Devlet' },
            { uni: 'Yıldız Teknik Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['18', '19'], type: 'Devlet' },
            { uni: 'Marmara Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['18', '19'], type: 'Devlet' },
            
            // İZMİR - DEVLET
            { uni: 'Ege Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['18'], type: 'Devlet' },
            
            // VAKIF ÜNİVERSİTELERİ - ANKARA
            { uni: 'Bilkent Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['14', '16', '17', '23', '24'], type: 'Vakıf' },
            
            // VAKIF ÜNİVERSİTELERİ - İSTANBUL (Premium - Tam Burs)
            { uni: 'Koç Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['14', '16', '17', '23'], type: 'Vakıf' },
            { uni: 'Sabancı Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['14', '16', '17', '23'], type: 'Vakıf' },
            { uni: 'Özyeğin Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['14', '16', '17', '23'], type: 'Vakıf' },
            { uni: 'MEF Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['14', '16', '17', '23'], type: 'Vakıf' },
            
            // VAKIF ÜNİVERSİTELERİ - İSTANBUL (İngilizce + Kısmi Burs)
            { uni: 'Bahçeşehir Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['13', '16', '17', '24'], type: 'Vakıf' },
            { uni: 'İstanbul Bilgi Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['13', '16', '17', '24'], type: 'Vakıf' },
            { uni: 'Yeditepe Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['13', '16', '17', '24'], type: 'Vakıf' },
            { uni: 'Işık Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['13', '16', '17', '24'], type: 'Vakıf' },
            
            // VAKIF ÜNİVERSİTELERİ - İSTANBUL (Standart)
            { uni: 'İstanbul Arel Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['16', '17', '24'], type: 'Vakıf' },
            { uni: 'İstanbul Medipol Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['16', '17', '24'], type: 'Vakıf' },
            { uni: 'Beykent Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['16', '17', '24'], type: 'Vakıf' },
            { uni: 'İstanbul Kültür Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['16', '17', '24'], type: 'Vakıf' },
            { uni: 'Maltepe Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['16', '17', '24'], type: 'Vakıf' },
            { uni: 'Doğuş Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['16', '17', '24'], type: 'Vakıf' },
            { uni: 'İstanbul Aydın Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['16', '17', '24'], type: 'Vakıf' },
            { uni: 'İstanbul Gelişim Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['16', '17', '24'], type: 'Vakıf' },
            { uni: 'İstanbul Ticaret Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['16', '17', '24'], type: 'Vakıf' },
            { uni: 'Haliç Üniversitesi', dept: 'Bilgisayar Mühendisliği', conditions: ['16', '17', '24'], type: 'Vakıf' },
            
            // ==============================
            // 2 YILLIK PROGRAMLAR (ÖZEL ŞARTLAR)
            // ==============================
            { uni: 'İstanbul Arel Üniversitesi', dept: 'Bilgisayar Programcılığı', conditions: ['16', '17', '24'], type: 'Vakıf' },
            { uni: 'Beykent Üniversitesi', dept: 'Bilgisayar Programcılığı', conditions: ['16', '17', '24'], type: 'Vakıf' },
            { uni: 'Haliç Üniversitesi', dept: 'Bilgisayar Programcılığı', conditions: ['16', '17', '24'], type: 'Vakıf' }
        ];
        
        console.log(`📊 Toplu ekleme yapılıyor: ${universityConditions.length} üniversite\n`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const item of universityConditions) {
            try {
                for (const condNum of item.conditions) {
                    const code = `${item.type === 'Devlet' ? '1' : '2'}${Math.random().toString().substr(2, 8)}`;
                    
                    await connection.query(`
                        INSERT INTO program_conditions 
                        (universityCode, universityName, programCode, programName, city, campus, conditionNumber, type, year)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 2024)
                        ON DUPLICATE KEY UPDATE 
                            conditionNumber = VALUES(conditionNumber),
                            updatedAt = CURRENT_TIMESTAMP
                    `, [code, item.uni, code, item.dept, 'Çeşitli', 'Merkez', condNum, item.type]);
                }
                successCount++;
                console.log(`✅ ${item.uni} - ${item.dept} (${item.conditions.join(', ')})`);
            } catch (error) {
                errorCount++;
                console.error(`❌ ${item.uni} - Hata:`, error.message);
            }
        }
        
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`✅ Başarılı: ${successCount}`);
        console.log(`❌ Hatalı: ${errorCount}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        
        // OTOMATIK ŞART ATAMA
        console.log('🔄 Eksik üniversiteler için otomatik şart ataması yapılıyor...\n');
        
        // Tüm üniversiteleri bul (universities tablosundan)
        const [allUnis] = await connection.query(`
            SELECT DISTINCT name, type, city, campus, department 
            FROM universities 
            WHERE year = 2024
        `);
        
        let autoAddedCount = 0;
        
        for (const uni of allUnis) {
            // Bu üniversite için şart var mı kontrol et
            const [existing] = await connection.query(`
                SELECT COUNT(*) as count 
                FROM program_conditions 
                WHERE universityName = ? 
                AND programName = ? 
                AND year = 2024
            `, [uni.name, uni.department]);
            
            if (existing[0].count === 0) {
                // Şart yok, varsayılan şart ekle
                const defaultConds = defaultConditions[uni.type] || defaultConditions['Devlet'];
                const code = `AUTO${Math.random().toString().substr(2, 8)}`;
                
                for (const condNum of defaultConds) {
                    await connection.query(`
                        INSERT INTO program_conditions 
                        (universityCode, universityName, programCode, programName, city, campus, conditionNumber, type, year)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 2024)
                    `, [code, uni.name, code, uni.department, uni.city, uni.campus, condNum, uni.type]);
                }
                
                autoAddedCount++;
                console.log(`🔹 Otomatik: ${uni.name} - ${uni.department} (${defaultConds.join(', ')})`);
            }
        }
        
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🔹 Otomatik eklenen: ${autoAddedCount}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        
        console.log('✅ Tamamlandı! Tüm üniversiteler için şart maddesi eklendi.\n');
        console.log('💡 Sunucuyu yeniden başlatın: node server.js\n');
        
    } catch (error) {
        console.error('❌ Hata:', error);
    } finally {
        connection.release();
        process.exit(0);
    }
}

// Script'i çalıştır
if (require.main === module) {
    addBulkConditions();
}

module.exports = { addBulkConditions };
