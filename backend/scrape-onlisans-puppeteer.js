/**
 * ÖNLİSANS PROGRAMLARI SCRAPER - PUPPETEER VERSİYON
 * 
 * Bilgisayar Mühendisliği alternatifi önlisans programlarını YÖK Atlas'tan çeker
 * Bot korumasını aşmak için Puppeteer kullanır
 */

const puppeteer = require('puppeteer');
const { pool } = require('./db');

// Önlisans programları listesi
const ONLISANS_PROGRAMS = [
    'Bilgisayar Programcılığı',
    'Bilgisayar Teknolojisi',
    'Bilişim Güvenliği Teknolojisi',
    'İnternet ve Ağ Teknolojileri',
    'Web Tasarım ve Kodlama',
    'Yazılım Geliştirme',
    'Bilgi Güvenliği Teknolojisi'
];

/**
 * YÖK Atlas'tan önlisans programlarını ara
 */
async function searchOnlisansWithPuppeteer(page, programName) {
    console.log(`\n🔍 Aranıyor: ${programName}`);
    
    try {
        // YÖK Atlas önlisans sayfasına git
        await page.goto('https://yokatlas.yok.gov.tr/onlisans.php', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Biraz bekle (sayfanın yüklenmesi için)
        await new Promise(r => setTimeout(r, 2000));
        
        // Arama kutusunu bul ve temizle
        await page.evaluate(() => {
            const inputs = document.querySelectorAll('input[type="text"]');
            inputs.forEach(input => input.value = '');
        });
        
        // Program adını yaz
        await page.type('input[type="text"]', programName, { delay: 100 });
        
        // Sonuçların yüklenmesini bekle
        await new Promise(r => setTimeout(r, 3000));
        
        // Sonuçları topla
        const programs = await page.evaluate(() => {
            const results = [];
            const links = document.querySelectorAll('a[href*="onlisans-"]');
            
            links.forEach(link => {
                const text = link.textContent.trim();
                const href = link.getAttribute('href');
                
                if (text && href && text.length > 5) {
                    // URL'den program ID'sini al
                    const match = href.match(/y=(\d+)/);
                    if (match) {
                        results.push({
                            id: match[1],
                            text: text,
                            url: href
                        });
                    }
                }
            });
            
            return results;
        });
        
        console.log(`   ✅ ${programs.length} program bulundu`);
        return programs;
        
    } catch (error) {
        console.error(`   ❌ Hata: ${error.message}`);
        return [];
    }
}

/**
 * Program detaylarını çek
 */
async function getProgramDetailsWithPuppeteer(page, programId, programText) {
    try {
        const url = `https://yokatlas.yok.gov.tr/onlisans-4.html?y=${programId}`;
        
        await page.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: 15000 
        });
        
        // Biraz bekle
        await new Promise(r => setTimeout(r, 1500));
        
        // Detayları çek
        const details = await page.evaluate((progText) => {
            const data = {
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
            
            // Başlıktan bilgi al
            const h1 = document.querySelector('h1');
            if (h1) {
                const parts = h1.textContent.trim().split(/\s+-\s+/);
                if (parts.length >= 2) {
                    data.university = parts[0].trim();
                    data.department = parts[1].trim();
                    if (parts.length >= 3) {
                        data.city = parts[2].trim();
                    }
                }
            }
            
            // Eğer başlıktan alamadıysak, text'ten parse et
            if (!data.university && progText) {
                const parts = progText.split(/\s+-\s+/);
                if (parts.length >= 2) {
                    data.university = parts[0].trim();
                    if (parts.length >= 3) {
                        data.city = parts[2].trim();
                    }
                }
            }
            
            // Tablodan verileri al
            const tables = document.querySelectorAll('table');
            tables.forEach(table => {
                const rows = table.querySelectorAll('tr');
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 2) {
                        const label = cells[0].textContent.trim().toLowerCase();
                        const value = cells[1].textContent.trim();
                        
                        if (label.includes('şehir') || label.includes('il:')) {
                            data.city = value;
                        } else if (label.includes('kontenjan')) {
                            data.quota = parseInt(value.replace(/\./g, '').replace(/,/g, '')) || null;
                        } else if (label.includes('yerleşen')) {
                            data.enrolled = parseInt(value.replace(/\./g, '').replace(/,/g, '')) || null;
                        } else if (label.includes('en küçük sıralama') || label.includes('taban sıralama')) {
                            data.minRanking = parseInt(value.replace(/\./g, '').replace(/,/g, '')) || null;
                        } else if (label.includes('en küçük puan') || label.includes('taban puan')) {
                            data.minScore = parseFloat(value.replace(',', '.')) || null;
                        } else if (label.includes('üniversite türü') || label.includes('tür:')) {
                            if (value.toLowerCase().includes('vakıf')) {
                                data.type = 'Vakıf';
                            }
                        } else if (label.includes('kampüs')) {
                            data.campus = value;
                        }
                    }
                });
            });
            
            return data;
        }, programText);
        
        return details;
        
    } catch (error) {
        console.error(`      ⚠️ Detay alınamadı (ID: ${programId})`);
        return null;
    }
}

/**
 * Veritabanına kaydet
 */
async function saveProgram(details) {
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
        console.error(`      ⚠️ Veritabanı hatası: ${error.message}`);
        return false;
    }
}

/**
 * Ana scraping fonksiyonu
 */
async function scrapeOnlisansWithPuppeteer() {
    console.log('\n==========================================');
    console.log('🚀 ÖNLİSANS PROGRAMLARI - PUPPETEER SCRAPER');
    console.log('==========================================');
    console.log(`📚 ${ONLISANS_PROGRAMS.length} önlisans programı taranacak:`);
    ONLISANS_PROGRAMS.forEach((prog, i) => {
        console.log(`   ${i + 1}. ${prog}`);
    });
    console.log('\n💡 Hem Devlet hem Vakıf üniversiteleri dahil');
    console.log('⏱️  Tahmini süre: 10-15 dakika\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
        ],
        defaultViewport: null
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
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
            const programs = await searchOnlisansWithPuppeteer(page, programName);
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
                    const details = await getProgramDetailsWithPuppeteer(page, prog.id, prog.text);
                    
                    if (details && details.university) {
                        // Department bilgisi yoksa program adını kullan
                        if (!details.department) {
                            details.department = programName;
                        }
                        
                        const saved = await saveProgram(details);
                        
                        if (saved) {
                            savedCount++;
                            totalSaved++;
                            
                            // Her 5 kayıtta bir progress göster
                            if (savedCount % 5 === 0) {
                                console.log(`      💾 ${savedCount}/${programs.length} - ${details.university} (${details.type})`);
                            }
                        }
                    } else {
                        errorCount++;
                        totalErrors++;
                    }
                    
                    // Rate limiting
                    await new Promise(r => setTimeout(r, 1000));
                    
                } catch (err) {
                    errorCount++;
                    totalErrors++;
                    console.error(`      ❌ Hata: ${err.message}`);
                }
            }
            
            console.log(`\n   ✅ Tamamlandı: ${savedCount} kaydedildi, ${errorCount} hata`);
            
            // Program arası mola
            if (i < ONLISANS_PROGRAMS.length - 1) {
                console.log('   ⏸️  Mola (5 saniye)...');
                await new Promise(r => setTimeout(r, 5000));
            }
            
        } catch (error) {
            console.error(`   ❌ Program hatası: ${error.message}`);
            totalErrors++;
        }
    }
    
    await browser.close();
    
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    
    console.log('\n==========================================');
    console.log('✅ SCRAPING TAMAMLANDI!');
    console.log('==========================================');
    console.log(`⏱️  Toplam süre: ${totalTime} dakika`);
    console.log(`📊 Toplam program: ${totalPrograms}`);
    console.log(`💾 Kaydedilen: ${totalSaved}`);
    console.log(`❌ Hata: ${totalErrors}`);
    console.log(`📈 Başarı oranı: ${totalPrograms > 0 ? ((totalSaved / totalPrograms) * 100).toFixed(1) : 0}%\n`);
    
    // İstatistikler
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
        
        // Program bazında
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
    scrapeOnlisansWithPuppeteer().catch(error => {
        console.error('\n❌ Fatal Hata:', error);
        process.exit(1);
    });
}

module.exports = { scrapeOnlisansWithPuppeteer, ONLISANS_PROGRAMS };
