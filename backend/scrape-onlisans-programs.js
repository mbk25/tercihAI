/**
 * ÖNLİSANS PROGRAMLARI SCRAPER
 * 
 * Bilgisayar Mühendisliği alternatifi önlisans programlarını YÖK Atlas'tan çeker:
 * - Bilgisayar Teknolojileri ve Bilişim Sistemleri
 * - Bilişim Güvenliği Teknolojisi
 * - İnternet ve Ağ Teknolojileri
 * 
 * Hem Devlet hem Vakıf üniversiteleri dahil
 */

const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const { pool } = require('./db');

// SSL sertifika doğrulamasını kapat
const httpsAgent = new https.Agent({  
    rejectUnauthorized: false
});

// Önlisans programları listesi
const ONLISANS_PROGRAMS = [
    'Bilgisayar Teknolojileri ve Bilişim Sistemleri',
    'Bilişim Güvenliği Teknolojisi',
    'İnternet ve Ağ Teknolojileri'
];

/**
 * YÖK Atlas önlisans arama API'si
 */
async function searchOnlisansPrograms(programName) {
    console.log(`\n🔍 Aranıyor: ${programName}`);
    
    try {
        // Önlisans için farklı endpoint kullanıyoruz
        const url = `https://yokatlas.yok.gov.tr/onlisans-ajax.php?q=${encodeURIComponent(programName)}`;
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': 'https://yokatlas.yok.gov.tr/onlisans.php',
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin'
            },
            httpsAgent,
            timeout: 30000
        });
        
        let programs = [];
        
        // JSON response
        if (typeof response.data === 'object' && Array.isArray(response.data)) {
            programs = response.data;
        } else if (typeof response.data === 'string') {
            // HTML response parse et
            const $ = cheerio.load(response.data);
            
            $('a').each((i, elem) => {
                const href = $(elem).attr('href');
                const text = $(elem).text().trim();
                
                if (href && href.includes('onlisans-') && text.length > 5) {
                    const match = href.match(/y=(\d+)/);
                    if (match) {
                        programs.push({
                            id: match[1],
                            label: text,
                            value: href
                        });
                    }
                }
            });
        }
        
        console.log(`   ✅ ${programs.length} program bulundu`);
        return programs;
        
    } catch (error) {
        console.error(`   ❌ Hata: ${error.message}`);
        return [];
    }
}

/**
 * Önlisans program detayını çek
 */
async function getOnlisansProgramDetails(programId) {
    try {
        // Önlisans için özel URL formatı
        const url = `https://yokatlas.yok.gov.tr/onlisans-4.html?y=${programId}`;
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://yokatlas.yok.gov.tr/onlisans.php',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin'
            },
            httpsAgent,
            timeout: 15000
        });
        
        const $ = cheerio.load(response.data);
        
        // Temel bilgiler
        const details = {
            university: null,
            department: null,
            city: null,
            campus: null,
            type: 'Devlet',
            quota: null,
            enrolled: null,
            minRanking: null,
            minScore: null,
            programType: 'Önlisans'
        };
        
        // Başlık parse et (format: "Üniversite - Bölüm - Şehir" veya "Üniversite - Bölüm")
        const h1 = $('h1').first().text().trim();
        const parts = h1.split(/\s+-\s+/);
        
        if (parts.length >= 2) {
            details.university = parts[0].trim();
            details.department = parts[1].trim();
            
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
                
                if (label.includes('şehir') || label.includes('il:')) {
                    details.city = value;
                } else if (label.includes('kontenjan')) {
                    details.quota = parseInt(value.replace(/\./g, '')) || null;
                } else if (label.includes('yerleşen')) {
                    details.enrolled = parseInt(value.replace(/\./g, '')) || null;
                } else if (label.includes('en küçük sıralama') || label.includes('tavan sıralama')) {
                    details.minRanking = parseInt(value.replace(/\./g, '')) || null;
                } else if (label.includes('en küçük puan') || label.includes('taban puan')) {
                    details.minScore = parseFloat(value.replace(',', '.')) || null;
                } else if (label.includes('üniversite türü') || label.includes('tür')) {
                    if (value.toLowerCase().includes('vakıf')) {
                        details.type = 'Vakıf';
                    }
                } else if (label.includes('kampüs')) {
                    details.campus = value;
                }
            }
        });
        
        // Alternatif tablo yapısı
        if (!details.university || !details.department) {
            const infoText = $('.panel-body').text() || $('body').text();
            
            // Üniversite adını bul
            const uniMatch = infoText.match(/Üniversite[:\s]+([^\n]+)/i);
            if (uniMatch) details.university = uniMatch[1].trim();
            
            // Bölüm adını bul
            const deptMatch = infoText.match(/Program[:\s]+([^\n]+)/i);
            if (deptMatch) details.department = deptMatch[1].trim();
        }
        
        return details;
        
    } catch (error) {
        console.error(`   ⚠️ Program detayı alınamadı (ID: ${programId}): ${error.message}`);
        return null;
    }
}

/**
 * Veritabanına kaydet
 */
async function saveOnlisansProgram(details) {
    if (!details || !details.university || !details.department) {
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
        
        return true;
    } catch (error) {
        console.error(`   ⚠️ Veritabanı hatası: ${error.message}`);
        return false;
    }
}

/**
 * Ana scraping fonksiyonu
 */
async function scrapeOnlisansPrograms() {
    console.log('\n==========================================');
    console.log('🚀 ÖNLİSANS PROGRAMLARI - YÖK ATLAS SCRAPING');
    console.log('==========================================');
    console.log(`📚 ${ONLISANS_PROGRAMS.length} önlisans programı taranacak:`);
    ONLISANS_PROGRAMS.forEach((prog, i) => {
        console.log(`   ${i + 1}. ${prog}`);
    });
    console.log('\n💡 Hem Devlet hem Vakıf üniversiteleri dahil');
    console.log('⏱️  Tahmini süre: 5-10 dakika\n');
    
    const startTime = Date.now();
    let totalPrograms = 0;
    let totalSaved = 0;
    let totalErrors = 0;
    
    for (let i = 0; i < ONLISANS_PROGRAMS.length; i++) {
        const programName = ONLISANS_PROGRAMS[i];
        const progress = ((i + 1) / ONLISANS_PROGRAMS.length * 100).toFixed(1);
        
        console.log(`\n[${ i + 1}/${ONLISANS_PROGRAMS.length}] (${progress}%) ${programName}`);
        console.log('─'.repeat(80));
        
        try {
            // 1. Programları ara
            const programs = await searchOnlisansPrograms(programName);
            totalPrograms += programs.length;
            
            if (programs.length === 0) {
                console.log('   ⚠️  Program bulunamadı');
                continue;
            }
            
            // 2. Her program için detay çek
            let savedCount = 0;
            let errorCount = 0;
            
            for (let j = 0; j < programs.length; j++) {
                const prog = programs[j];
                
                try {
                    // Program ID'yi al
                    let programId = prog.id || prog.value;
                    if (typeof programId === 'string' && programId.includes('y=')) {
                        const match = programId.match(/y=(\d+)/);
                        if (match) programId = match[1];
                    }
                    
                    // Detay çek
                    const details = await getOnlisansProgramDetails(programId);
                    
                    if (details && details.university) {
                        const saved = await saveOnlisansProgram(details);
                        
                        if (saved) {
                            savedCount++;
                            totalSaved++;
                            
                            // Her 5 kayıtta bir progress göster
                            if (savedCount % 5 === 0) {
                                console.log(`      💾 ${savedCount}/${programs.length} kaydedildi... (${details.type})`);
                            }
                        }
                    } else {
                        errorCount++;
                        totalErrors++;
                    }
                    
                    // Rate limiting - YÖK Atlas'ı yormamak için
                    await new Promise(r => setTimeout(r, 800));
                    
                } catch (err) {
                    errorCount++;
                    totalErrors++;
                    console.error(`      ❌ Hata: ${err.message}`);
                }
            }
            
            console.log(`\n   ✅ Tamamlandı: ${savedCount} kaydedildi, ${errorCount} hata`);
            
            // Program arası kısa mola
            if (i < ONLISANS_PROGRAMS.length - 1) {
                console.log('   ⏸️  Kısa mola (3 saniye)...');
                await new Promise(r => setTimeout(r, 3000));
            }
            
        } catch (error) {
            console.error(`   ❌ Program hatası: ${error.message}`);
            totalErrors++;
        }
    }
    
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    
    console.log('\n==========================================');
    console.log('✅ SCRAPING TAMAMLANDI!');
    console.log('==========================================');
    console.log(`⏱️  Toplam süre: ${totalTime} dakika`);
    console.log(`📊 Toplam program: ${totalPrograms}`);
    console.log(`💾 Kaydedilen: ${totalSaved}`);
    console.log(`❌ Hata: ${totalErrors}`);
    console.log(`📈 Başarı oranı: ${totalPrograms > 0 ? ((totalSaved / totalPrograms) * 100).toFixed(1) : 0}%\n`);
    
    // Veritabanı istatistikleri
    try {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN type = 'Devlet' THEN 1 ELSE 0 END) as devlet,
                SUM(CASE WHEN type = 'Vakıf' THEN 1 ELSE 0 END) as vakif,
                COUNT(DISTINCT city) as cities
            FROM universities
            WHERE programType = 'Önlisans'
            AND department IN (?, ?, ?)
        `, ONLISANS_PROGRAMS);
        
        console.log('📊 Önlisans Program İstatistikleri:');
        console.log(`   Toplam: ${stats[0].total} program`);
        console.log(`   Devlet: ${stats[0].devlet} program`);
        console.log(`   Vakıf: ${stats[0].vakif} program`);
        console.log(`   Şehir: ${stats[0].cities} farklı şehir\n`);
        
        // Her program için ayrı istatistik
        for (const progName of ONLISANS_PROGRAMS) {
            const [progStats] = await pool.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN type = 'Devlet' THEN 1 ELSE 0 END) as devlet,
                    SUM(CASE WHEN type = 'Vakıf' THEN 1 ELSE 0 END) as vakif
                FROM universities
                WHERE department = ? AND programType = 'Önlisans'
            `, [progName]);
            
            console.log(`   📌 ${progName}:`);
            console.log(`      Toplam: ${progStats[0].total} (Devlet: ${progStats[0].devlet}, Vakıf: ${progStats[0].vakif})`);
        }
        
    } catch (error) {
        console.error('⚠️ İstatistik hesaplanamadı:', error.message);
    }
    
    await pool.end();
    process.exit(0);
}

// Çalıştır
if (require.main === module) {
    scrapeOnlisansPrograms().catch(error => {
        console.error('\n❌ Fatal Hata:', error);
        process.exit(1);
    });
}

module.exports = { 
    scrapeOnlisansPrograms, 
    searchOnlisansPrograms, 
    getOnlisansProgramDetails,
    ONLISANS_PROGRAMS 
};
