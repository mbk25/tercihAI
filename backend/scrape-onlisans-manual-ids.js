/**
 * YÖK Atlas Önlisans - Manuel Program Kodları ile Veri Çekme
 * 
 * Bu script belirli program kodlarından detay bilgilerini çeker
 * Program kodları YÖK Atlas'tan manuel olarak alınabilir
 */

const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const { pool } = require('./db');

const httpsAgent = new https.Agent({  
    rejectUnauthorized: false
});

/**
 * Program kodlarını buraya ekleyin
 * Format: YÖK Atlas'taki program ID'leri
 * 
 * Örnek: https://yokatlas.yok.gov.tr/onlisans.php?y=123456
 * ID: 123456
 * 
 * Program kodlarını bulmak için:
 * 1. https://yokatlas.yok.gov.tr/onlisans.php adresine gidin
 * 2. İlgili programı aratın
 * 3. URL'deki y= parametresinden sonraki sayıyı alın
 */

// BURAYA PROGRAM KODLARINI EKLEYİN!
// Şu an boş - manual olarak doldurulacak
const PROGRAM_IDS = [
    // Bilgisayar Programcılığı örnekleri (bu kodlar placeholder - gerçek kodlar girilecek)
    // { id: '123456', programName: 'Bilgisayar Programcılığı' },
    // { id: '123457', programName: 'Bilgisayar Teknolojisi' },
];

/**
 * Program detayını çek
 */
async function getOnlisansProgramDetails(programId, programName) {
    try {
        const url = `https://yokatlas.yok.gov.tr/onlisans.php?y=${programId}`;
        
        console.log(`   📡 Çekiliyor: ${url}`);
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'tr-TR,tr;q=0.9',
                'Referer': 'https://yokatlas.yok.gov.tr/onlisans.php'
            },
            httpsAgent,
            timeout: 15000
        });
        
        const $ = cheerio.load(response.data);
        
        // Detayları parse et
        const details = {
            university: null,
            department: programName,
            city: null,
            campus: null,
            type: 'Devlet',
            quota: null,
            enrolled: null,
            minRanking: null,
            minScore: null,
            programType: 'Önlisans'
        };
        
        // Başlıktan bilgi al
        const h1 = $('h1, .baslik').first().text().trim();
        if (h1) {
            const parts = h1.split(/\s+-\s+/);
            if (parts.length >= 1) {
                details.university = parts[0].trim();
            }
            if (parts.length >= 2) {
                details.department = parts[1].trim();
            }
            if (parts.length >= 3) {
                details.city = parts[2].trim();
            }
        }
        
        // Tablo verilerini çek
        $('table tr').each((i, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 2) {
                const label = $(cells[0]).text().trim().toLowerCase();
                const value = $(cells[1]).text().trim();
                
                if (label.includes('şehir') || label.includes('il')) {
                    details.city = value;
                } else if (label.includes('üniversite') && label.includes('ad')) {
                    details.university = value;
                } else if (label.includes('program') && label.includes('ad')) {
                    details.department = value;
                } else if (label.includes('kontenjan')) {
                    details.quota = parseInt(value.replace(/\D/g, '')) || null;
                } else if (label.includes('yerleşen')) {
                    details.enrolled = parseInt(value.replace(/\D/g, '')) || null;
                } else if (label.includes('sıralama') || label.includes('sıra')) {
                    const num = parseInt(value.replace(/\D/g, '')) || null;
                    if (num) details.minRanking = num;
                } else if (label.includes('puan')) {
                    const num = parseFloat(value.replace(',', '.')) || null;
                    if (num) details.minScore = num;
                } else if (label.includes('tür') || label.includes('vakıf')) {
                    if (value.toLowerCase().includes('vakıf')) {
                        details.type = 'Vakıf';
                    }
                } else if (label.includes('kampüs')) {
                    details.campus = value;
                }
            }
        });
        
        return details;
        
    } catch (error) {
        console.error(`   ❌ Hata: ${error.message}`);
        return null;
    }
}

/**
 * Veritabanına kaydet
 */
async function saveProgram(details) {
    if (!details || !details.university || !details.department) {
        console.log(`   ⚠️  Eksik veri, kaydedilmedi`);
        return false;
    }
    
    try {
        await pool.query(`
            INSERT INTO universities 
            (name, type, city, campus, department, quota, enrolled, ranking, minRanking, minScore, year, programType)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            quota = VALUES(quota),
            enrolled = VALUES(enrolled),
            ranking = VALUES(ranking),
            minRanking = VALUES(minRanking),
            minScore = VALUES(minScore),
            programType = VALUES(programType),
            updatedAt = CURRENT_TIMESTAMP
        `, [
            details.university,
            details.type,
            details.city || 'Bilinmiyor',
            details.campus || 'Merkez Kampüs',
            details.department,
            details.quota,
            details.enrolled,
            details.minRanking,
            details.minRanking,
            details.minScore,
            2024,
            'Önlisans'
        ]);
        
        console.log(`   ✅ Kaydedildi: ${details.university} - ${details.department} (${details.type})`);
        return true;
        
    } catch (error) {
        console.error(`   ❌ Veritabanı hatası: ${error.message}`);
        return false;
    }
}

/**
 * Ana fonksiyon
 */
async function scrapeOnlisansFromIds() {
    console.log('\n==========================================');
    console.log('🚀 ÖNLİSANS - MANUEL KOD İLE VERİ ÇEKME');
    console.log('==========================================\n');
    
    if (PROGRAM_IDS.length === 0) {
        console.log('⚠️  UYARI: PROGRAM_IDS dizisi boş!');
        console.log('\n📝 Program kodlarını eklemek için:');
        console.log('   1. https://yokatlas.yok.gov.tr/onlisans.php adresine gidin');
        console.log('   2. İstediğiniz programı aratın (örn: "Bilgisayar Programcılığı")');
        console.log('   3. Sonuç linklerine tıklayın');
        console.log('   4. URL\'den program ID\'sini alın (y=XXXXX)');
        console.log('   5. Bu script\'teki PROGRAM_IDS dizisine ekleyin\n');
        console.log('Örnek:');
        console.log('const PROGRAM_IDS = [');
        console.log('    { id: "123456", programName: "Bilgisayar Programcılığı" },');
        console.log('    { id: "123457", programName: "Bilgisayar Teknolojisi" },');
        console.log('];\n');
        
        await pool.end();
        process.exit(0);
    }
    
    console.log(`📊 ${PROGRAM_IDS.length} program işlenecek\n`);
    
    let savedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < PROGRAM_IDS.length; i++) {
        const prog = PROGRAM_IDS[i];
        console.log(`\n[${i + 1}/${PROGRAM_IDS.length}] ${prog.programName} (ID: ${prog.id})`);
        console.log('─'.repeat(60));
        
        try {
            const details = await getOnlisansProgramDetails(prog.id, prog.programName);
            
            if (details) {
                const saved = await saveProgram(details);
                if (saved) savedCount++;
                else errorCount++;
            } else {
                errorCount++;
            }
            
            // Rate limiting
            await new Promise(r => setTimeout(r, 2000));
            
        } catch (error) {
            console.error(`   ❌ İşlem hatası: ${error.message}`);
            errorCount++;
        }
    }
    
    console.log('\n==========================================');
    console.log('✅ İŞLEM TAMAMLANDI!');
    console.log('==========================================');
    console.log(`💾 Kaydedilen: ${savedCount}`);
    console.log(`❌ Hata: ${errorCount}\n`);
    
    await pool.end();
    process.exit(0);
}

// Çalıştır
if (require.main === module) {
    scrapeOnlisansFromIds().catch(error => {
        console.error('\n❌ Fatal hata:', error);
        process.exit(1);
    });
}

module.exports = { scrapeOnlisansFromIds, getOnlisansProgramDetails };
