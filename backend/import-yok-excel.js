/**
 * YÖK ATLAS EXCEL İMPORT SCRIPT'İ
 * 
 * ÖSYM'nin yayınladığı Excel dosyasını MySQL'e import eder
 * 
 * Kullanım:
 * 1. Excel dosyasını indirin: https://dokuman.osym.gov.tr/pdfdokuman/2024/YKS/YER/sayisalbilgiler.xls
 * 2. Excel'i CSV'ye çevirin (Excel'de "Farklı Kaydet" > CSV)
 * 3. CSV dosyasını "yok-data.csv" olarak kaydedin
 * 4. Bu script'i çalıştırın: node import-yok-excel.js
 */

const fs = require('fs');
const { pool } = require('./db');
const csv = require('csv-parser'); // npm install csv-parser

const CSV_FILE = 'yok-data.csv';

async function importFromCSV() {
    console.log('\n==========================================');
    console.log('📊 YÖK EXCEL VERISI İMPORT EDİLİYOR');
    console.log('==========================================\n');
    
    if (!fs.existsSync(CSV_FILE)) {
        console.error(`❌ Dosya bulunamadı: ${CSV_FILE}`);
        console.log('\n📝 Yapmanız gerekenler:');
        console.log('1. https://www.osym.gov.tr/ adresinden Excel dosyasını indirin');
        console.log('2. Excel\'i açın ve "Farklı Kaydet" > "CSV (Virgülle Ayrılmış)" seçin');
        console.log('3. Dosyayı "yok-data.csv" olarak bu klasöre kaydedin');
        console.log('4. Bu script\'i tekrar çalıştırın');
        process.exit(1);
    }
    
    const connection = await pool.getConnection();
    let imported = 0;
    let skipped = 0;
    
    try {
        console.log('📖 CSV dosyası okunuyor...\n');
        
        const stream = fs.createReadStream(CSV_FILE)
            .pipe(csv({
                separator: ';', // Türkçe Excel genelde ; kullanır
                headers: [
                    'universityCode',
                    'universityName',
                    'programCode',
                    'programName',
                    'city',
                    'type',
                    'educationType',
                    'quota',
                    'enrolled',
                    'minScore',
                    'maxScore',
                    'minRanking',
                    'maxRanking'
                ],
                skipLines: 1 // İlk satır başlık
            }));
        
        for await (const row of stream) {
            try {
                // Boş satırları atla
                if (!row.universityName || !row.programName) {
                    skipped++;
                    continue;
                }
                
                await connection.query(`
                    INSERT INTO universities 
                    (name, type, city, campus, department, quota, enrolled, ranking, minRanking, minScore, year)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    quota = VALUES(quota),
                    enrolled = VALUES(enrolled),
                    ranking = VALUES(ranking),
                    minRanking = VALUES(minRanking),
                    minScore = VALUES(minScore),
                    updatedAt = CURRENT_TIMESTAMP
                `, [
                    row.universityName,
                    row.type || 'Devlet',
                    row.city,
                    'Merkez Kampüs',
                    row.programName,
                    parseInt(row.quota) || null,
                    parseInt(row.enrolled) || null,
                    parseInt(row.minRanking?.replace(/\./g, '')) || null,
                    parseInt(row.minRanking?.replace(/\./g, '')) || null,
                    parseFloat(row.minScore?.replace(',', '.')) || null,
                    2024
                ]);
                
                imported++;
                
                if (imported % 100 === 0) {
                    console.log(`   ✅ ${imported} program import edildi...`);
                }
                
            } catch (err) {
                console.error(`      ⚠️ Hata: ${row.universityName} - ${row.programName}`);
                skipped++;
            }
        }
        
        console.log('\n==========================================');
        console.log('✅ IMPORT TAMAMLANDI!');
        console.log('==========================================');
        console.log(`📊 Import edilen: ${imported}`);
        console.log(`⚠️  Atlanan: ${skipped}`);
        console.log(`📈 Başarı oranı: ${((imported / (imported + skipped)) * 100).toFixed(1)}%`);
        
    } catch (error) {
        console.error('❌ Fatal hata:', error);
    } finally {
        connection.release();
        await pool.end();
    }
    
    process.exit(0);
}

// CSV parser yüklü mü kontrol et
try {
    require.resolve('csv-parser');
} catch (e) {
    console.log('📦 csv-parser yükleniyor...');
    require('child_process').execSync('npm install csv-parser', { stdio: 'inherit' });
}

importFromCSV();
