/**
 * YÖK ATLAS KAPSAMLI VERİ ÇEKME SİSTEMİ
 * 
 * Tüm Türkiye'deki üniversitelerin ve bölümlerin verilerini çeker.
 * 
 * Çıktı Formatı:
 * {
 *   "name": "İstanbul Üniversitesi",
 *   "type": "Devlet",
 *   "city": "İstanbul",
 *   "campus": "Avcılar Kampüsü",
 *   "program": "Bilgisayar Programcılığı",
 *   "quota": 70,
 *   "enrolled": 70,
 *   "minRanking": 198456,
 *   "minScore": 265.48,
 *   "language": "Türkçe",
 *   "educationType": "Örgün Öğretim",
 *   "scholarship": null
 * }
 */

const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const { pool } = require('./db');

// Progress tracking
let stats = {
    totalPrograms: 0,
    processedPrograms: 0,
    successfulPrograms: 0,
    failedPrograms: 0,
    totalUniversities: 0,
    startTime: null,
    checkpoints: []
};

/**
 * YÖK Atlas'tan tüm LISANS bölüm kodlarını çeker
 */
async function getAllProgramCodes(page) {
    console.log('\n📋 YÖK Atlas\'tan LISANS bölüm kodları çekiliyor...\n');

    try {
        await page.goto('https://yokatlas.yok.gov.tr/lisans-anasayfa.php', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        await page.waitForSelector('#bolum', { timeout: 10000 });

        const programs = await page.evaluate(() => {
            const results = [];
            const bolumSelect = document.querySelector('#bolum');

            if (!bolumSelect) return [];

            const options = bolumSelect.querySelectorAll('option');

            options.forEach(option => {
                const value = option.value;
                const text = option.textContent.trim();

                if (value && value.match(/^\d+$/) && text && text.length > 3) {
                    results.push({
                        code: value,
                        name: text,
                        type: 'lisans'
                    });
                }
            });

            return results;
        });

        console.log(`✅ ${programs.length} lisans bölüm kodu bulundu\n`);
        return programs;

    } catch (error) {
        console.error('❌ Lisans bölüm kodları çekilirken hata:', error.message);
        return [];
    }
}

/**
 * YÖK Atlas'tan tüm ÖNLİSANS bölüm kodlarını çeker
 */
async function getAllProgramCodesOnlisans(page) {
    console.log('\n📋 YÖK Atlas\'tan ÖNLİSANS bölüm kodları çekiliyor...\n');

    try {
        await page.goto('https://yokatlas.yok.gov.tr/onlisans-anasayfa.php', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // ÖNLİSANS sayfasında selector #program  (lisansta #bolum)
        await page.waitForSelector('#program', { timeout: 10000 });

        const programs = await page.evaluate(() => {
            const results = [];
            const programSelect = document.querySelector('#program');

            if (!programSelect) return [];

            const options = programSelect.querySelectorAll('option');

            options.forEach(option => {
                const value = option.value;
                const text = option.textContent.trim();

                if (value && value.match(/^\d+$/) && text && text.length > 3) {
                    results.push({
                        code: value,
                        name: text,
                        type: 'onlisans'
                    });
                }
            });

            return results;
        });

        console.log(`✅ ${programs.length} önlisans bölüm kodu bulundu\n`);
        return programs;

    } catch (error) {
        console.error('❌ Önlisans bölüm kodları çekilirken hata:', error.message);
        return [];
    }
}

/**
 * Belirli bir bölüm için tüm üniversiteleri çeker
 */
async function scrapeProgramUniversities(page, programCode, programName, programType = 'lisans') {
    try {
        const baseUrl = programType === 'onlisans' ? 'onlisans-bolum.php' : 'lisans-bolum.php';
        const url = `https://yokatlas.yok.gov.tr/${baseUrl}?b=${programCode}`;

        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        // Sayfanın yüklenmesini bekle
        await new Promise(r => setTimeout(r, 2000));

        // Üniversite linklerini çek
        const universityLinks = await page.evaluate(() => {
            const links = [];
            const anchors = document.querySelectorAll('a[href*="lisans.php?y="]');

            anchors.forEach(a => {
                const href = a.getAttribute('href');
                const match = href.match(/y=(\d+)/);
                if (match) {
                    links.push({
                        programId: match[1],
                        url: href.startsWith('http') ? href : `https://yokatlas.yok.gov.tr/${href}`
                    });
                }
            });

            return links;
        });

        console.log(`   📊 ${universityLinks.length} üniversite bulundu`);

        return universityLinks;

    } catch (error) {
        console.error(`   ❌ Hata: ${error.message}`);
        return [];
    }
}

/**
 * Belirli bir program detayını çeker (user'ın istediği formatta)
 */
async function scrapeProgramDetails(page, programId, programName, programType = 'lisans') {
    try {
        const pageType = programType === 'onlisans' ? 'onlisans.php' : 'lisans.php';
        const url = `https://yokatlas.yok.gov.tr/${pageType}?y=${programId}`;

        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        // Sayfanın yüklenmesini bekle
        await new Promise(r => setTimeout(r, 2000));

        // Accordion'ları expand et - Genel Bilgiler (#c1000_1)
        try {
            await page.click('a[href="#c1000_1"]');
            await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
            // Accordion yoksa veya tıklanamıyorsa devam et
        }

        // Veriyi çek
        const programData = await page.evaluate((progName) => {
            const data = {
                name: null,
                type: null,
                city: null,
                campus: null,
                program: progName,
                quota: null,
                enrolled: null,
                minRanking: null,
                minScore: null,
                language: null,
                educationType: null,
                scholarship: null
            };

            // Helper function: accordion içindeki tablolardan değer al
            function getValueFromAccordion(accordionId, rowText, returnNumber = false) {
                const accordion = document.querySelector(accordionId);
                if (!accordion) return null;

                const tables = accordion.querySelectorAll('table');
                for (let table of tables) {
                    const rows = table.querySelectorAll('tr');
                    for (let row of rows) {
                        const cells = row.querySelectorAll('td');
                        if (cells.length >= 2) {
                            const label = cells[0].textContent.trim().toLowerCase();
                            if (label.includes(rowText.toLowerCase())) {
                                const value = cells[1].textContent.trim();
                                if (returnNumber) {
                                    // Sayıyı parse et (nokta ve virgül temizle, * işaretlerini kaldır)
                                    const cleaned = value.replace(/[\*\.\s]/g, '').replace(',', '.');
                                    return parseFloat(cleaned) || null;
                                }
                                return value.replace(/[\*]/g, '').trim() || null;
                            }
                        }
                    }
                }
                return null;
            }

            // Header'dan üniversite adı ve şehir
            const h3 = document.querySelector('h3.panel-title.pull-left');
            if (h3) {
                const headerText = h3.textContent.trim();
                // Format: "ABDULLAH GÜL ÜNİVERSİTESİ (KAYSERİ)"
                const match = headerText.match(/(.*?)\s*\((.*?)\)/);
                if (match) {
                    data.name = match[1].trim();
                    data.city = match[2].trim();
                }
            }

            // Üniversite türü (Devlet/Vakıf)
            // Önce label'dan kontrol et
            const typeLabel = document.querySelector('.label-success, .label-info, .pull-right.hidden-xs');
            if (typeLabel) {
                const typeText = typeLabel.textContent.trim().toLowerCase();
                data.type = typeText.includes('vakıf') || typeText.includes('özel') ? 'Vakıf' : 'Devlet';
            }

            // Üniversite adından da kontrol et (bazı vakıf üniversiteleri düzgün label içermiyor)
            const vakifKeywords = ['üsküdar', 'bahçeşehir', 'işık', 'kadir has', 'koç', 'sabancı',
                'bilkent', 'atılım', 'başkent', 'tobb', 'ted', 'özyeğin',
                'yeditepe', 'maltepe', 'beykent', 'haliç', 'doğuş', 'fatih'];
            if (data.name) {
                const uniName = data.name.toLowerCase();
                for (let keyword of vakifKeywords) {
                    if (uniName.includes(keyword)) {
                        data.type = 'Vakıf';
                        break;
                    }
                }
            }

            // Genel Bilgiler tablosundan (#c1000_1)
            const fakulte = getValueFromAccordion('#c1000_1', 'fakülte');
            if (fakulte) {
                data.campus = fakulte; // Fakülte adını campus olarak kullan
            }

            // Program adından dil bilgisini çıkar
            const programHeader = document.querySelector('#c1000_1 table th big');
            if (programHeader) {
                const progText = programHeader.textContent.trim();
                if (progText.includes('(İngilizce)') || progText.includes('(English)')) {
                    data.language = 'İngilizce';
                } else if (progText.includes('(İÖ)')) {
                    data.educationType = 'İkinci Öğretim';
                } else {
                    data.language = 'Türkçe';
                    data.educationType = 'Örgün Öğretim';
                }
            }

            // Kontenjan (#c1000_1 ikinci tablo)
            data.quota = getValueFromAccordion('#c1000_1', 'toplam kontenjan', true);

            // Yerleşen  
            data.enrolled = getValueFromAccordion('#c1000_1', 'toplam yerleşen', true);

            // En küçük sıralama (#c1000_1 üçüncü tablo)
            data.minRanking = getValueFromAccordion('#c1000_1', 'en küçük sıralama', true) ||
                getValueFromAccordion('#c1000_1', '0,12 katsayı', true);

            // En küçük puan
            data.minScore = getValueFromAccordion('#c1000_1', 'en küçük puan', true) ||
                getValueFromAccordion('#c1000_1', '0,12 puan', true);

            // Burs (sadece vakıf üniversiteleri için)
            if (data.type === 'Vakıf') {
                const burs = getValueFromAccordion('#c1000_1', 'burs');
                data.scholarship = burs;
            }

            return data;
        }, programName);

        return programData;

    } catch (error) {
        console.error(`      ⚠️ Program detayı alınamadı (ID: ${programId}):`, error.message);
        return null;
    }
}

/**
 * Checkpoint sistemi - ilerlemeyi kaydet
 */
async function saveCheckpoint(programCode, programName, universities) {
    const checkpoint = {
        timestamp: new Date().toISOString(),
        programCode,
        programName,
        universitiesCount: universities.length,
        stats: { ...stats }
    };

    stats.checkpoints.push(checkpoint);

    // JSON dosyasına kaydet
    await fs.writeFile(
        './scraping-checkpoint.json',
        JSON.stringify(stats, null, 2),
        'utf8'
    );
}

/**
 * Verileri veritabanına kaydet
 */
async function saveProgramsToDatabase(universities) {
    if (universities.length === 0) return 0;

    const connection = await pool.getConnection();
    let savedCount = 0;

    try {
        for (const uni of universities) {
            try {
                await connection.query(`
                    INSERT INTO universities 
                    (name, type, city, campus, department, quota, enrolled, 
                     ranking, minRanking, minScore, educationLanguage, 
                     educationType, scholarshipRate, year)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    quota = VALUES(quota),
                    enrolled = VALUES(enrolled),
                    ranking = VALUES(ranking),
                    minRanking = VALUES(minRanking),
                    minScore = VALUES(minScore),
                    educationLanguage = VALUES(educationLanguage),
                    educationType = VALUES(educationType),
                    scholarshipRate = VALUES(scholarshipRate),
                    updatedAt = CURRENT_TIMESTAMP
                `, [
                    uni.name,
                    uni.type,
                    uni.city,
                    uni.campus,
                    uni.program,
                    uni.quota,
                    uni.enrolled,
                    uni.minRanking, // ranking
                    uni.minRanking,
                    uni.minScore,
                    uni.language,
                    uni.educationType,
                    uni.scholarship,
                    2024
                ]);

                savedCount++;
            } catch (err) {
                console.error(`      ⚠️ Kayıt hatası (${uni.name}):`, err.message);
            }
        }
    } finally {
        connection.release();
    }

    return savedCount;
}

/**
 * Verileri TEK JSON dosyasına kaydet (append mode)
 */
async function saveToJSON(universities, programName) {
    const mainFile = './all-universities.json';

    try {
        let allData = [];

        // Mevcut dosyayı oku (varsa)
        try {
            const existing = await fs.readFile(mainFile, 'utf8');
            allData = JSON.parse(existing);
        } catch (e) {
            // Dosya yoksa boş array ile başla
        }

        // Yeni verileri ekle
        allData.push(...universities);

        // Dosyaya yaz
        await fs.writeFile(
            mainFile,
            JSON.stringify(allData, null, 2),
            'utf8'
        );

        console.log(`   💾 JSON: ${mainFile} (Toplam: ${allData.length} kayıt)`);
    } catch (error) {
        console.error(`   ❌ JSON kayıt hatası:`, error.message);
    }
}

/**
 * Ana scraping fonksiyonu
 */
async function scrapeAllPrograms(options = {}) {
    const {
        startFrom = 0,
        limit = null,
        delayBetweenPrograms = 2000,
        delayBetweenUniversities = 500,
        saveToDb = true,
        saveJson = true
    } = options;

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║   YÖK ATLAS KAPSAMLI VERİ ÇEKME SİSTEMİ              ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    stats.startTime = new Date();

    // Puppeteer başlat
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // User agent ayarla
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        // 1. Tüm bölüm kodlarını çek (LİSANS + ÖNLİSANS)
        const lisansPrograms = await getAllProgramCodes(page);
        const onlisansPrograms = await getAllProgramCodesOnlisans(page);

        const programs = [...lisansPrograms, ...onlisansPrograms];

        if (programs.length === 0) {
            console.error('❌ Hiç bölüm kodu bulunamadı!');
            return;
        }

        // Program kodlarını kaydet
        const programMap = {};
        programs.forEach(p => {
            programMap[p.code] = `${p.name} (${p.type === 'onlisans' ? 'Önlisans' : 'Lisans'})`;
        });
        await fs.writeFile(
            './program-codes.json',
            JSON.stringify(programMap, null, 2),
            'utf8'
        );
        console.log('💾 Bölüm kodları program-codes.json dosyasına kaydedildi\n');

        stats.totalPrograms = programs.length;

        const programsToProcess = programs.slice(
            startFrom,
            limit ? startFrom + limit : programs.length
        );

        console.log(`📊 Toplam ${stats.totalPrograms} bölüm bulundu`);
        console.log(`🎯 ${programsToProcess.length} bölüm işlenecek (${startFrom} - ${startFrom + programsToProcess.length - 1})\n`);
        console.log('═'.repeat(60));

        // 2. Her bölüm için üniversiteleri çek
        for (let i = 0; i < programsToProcess.length; i++) {
            const program = programsToProcess[i];
            const actualIndex = startFrom + i;

            console.log(`\n[${actualIndex + 1}/${stats.totalPrograms}] ${program.name}`);
            console.log('─'.repeat(60));

            stats.processedPrograms++;

            try {
                // Üniversite linklerini al
                const universityLinks = await scrapeProgramUniversities(
                    page,
                    program.code,
                    program.name,
                    program.type
                );

                if (universityLinks.length === 0) {
                    console.log('   ⚠️ Bu bölüm için üniversite bulunamadı');
                    stats.failedPrograms++;
                    continue;
                }

                // Her üniversite için detay çek
                const allUniversityData = [];

                for (let j = 0; j < universityLinks.length; j++) {
                    process.stdout.write(`\r   İşleniyor: ${j + 1}/${universityLinks.length} üniversite...`);

                    const link = universityLinks[j];
                    const programData = await scrapeProgramDetails(
                        page,
                        link.programId,
                        program.name,
                        program.type
                    );

                    if (programData && programData.name) {
                        allUniversityData.push(programData);
                        stats.totalUniversities++;
                    }

                    // Rate limiting
                    await new Promise(r => setTimeout(r, delayBetweenUniversities));
                }

                console.log(`\n   ✅ ${allUniversityData.length} üniversite verisi çekildi`);

                // Veritabanına kaydet
                if (saveToDb && allUniversityData.length > 0) {
                    const saved = await saveProgramsToDatabase(allUniversityData);
                    console.log(`   💾 Veritabanı: ${saved} kayıt`);
                }

                // JSON'a kaydet
                if (saveJson && allUniversityData.length > 0) {
                    await saveToJSON(allUniversityData, program.name);
                }

                // Checkpoint kaydet (her 10 bölümde bir)
                if ((i + 1) % 10 === 0) {
                    await saveCheckpoint(program.code, program.name, allUniversityData);
                    console.log('   📍 Checkpoint kaydedildi');
                }

                stats.successfulPrograms++;

            } catch (error) {
                console.error(`\n   ❌ Hata: ${error.message}`);
                stats.failedPrograms++;
            }

            // Bölümler arası gecikme
            if (i < programsToProcess.length - 1) {
                await new Promise(r => setTimeout(r, delayBetweenPrograms));
            }

            // İlerleme raporu (her 20 bölümde bir)
            if ((i + 1) % 20 === 0) {
                printProgressReport();
            }
        }

    } finally {
        await browser.close();
    }

    // Final rapor
    printFinalReport();
}

/**
 * İlerleme raporu yazdır
 */
function printProgressReport() {
    const elapsed = (new Date() - stats.startTime) / 1000;
    const avgTimePerProgram = elapsed / stats.processedPrograms;
    const remaining = (stats.totalPrograms - stats.processedPrograms) * avgTimePerProgram;

    console.log('\n' + '═'.repeat(60));
    console.log('📊 İLERLEME RAPORU');
    console.log('═'.repeat(60));
    console.log(`İşlenen: ${stats.processedPrograms}/${stats.totalPrograms} bölüm`);
    console.log(`Başarılı: ${stats.successfulPrograms} | Başarısız: ${stats.failedPrograms}`);
    console.log(`Toplam üniversite: ${stats.totalUniversities}`);
    console.log(`Geçen süre: ${Math.floor(elapsed / 60)} dakika`);
    console.log(`Kalan süre (tahmini): ${Math.floor(remaining / 60)} dakika`);
    console.log('═'.repeat(60) + '\n');
}

/**
 * Final rapor yazdır
 */
function printFinalReport() {
    const elapsed = (new Date() - stats.startTime) / 1000;

    console.log('\n\n' + '╔' + '═'.repeat(58) + '╗');
    console.log('║' + ' '.repeat(18) + 'SCRAPING TAMAMLANDI' + ' '.repeat(19) + '║');
    console.log('╚' + '═'.repeat(58) + '╝\n');

    console.log('📊 SONUÇLAR:');
    console.log('─'.repeat(60));
    console.log(`✅ Başarılı bölümler: ${stats.successfulPrograms}`);
    console.log(`❌ Başarısız bölümler: ${stats.failedPrograms}`);
    console.log(`🎓 Toplam üniversite programı: ${stats.totalUniversities}`);
    console.log(`⏱️  Toplam süre: ${Math.floor(elapsed / 60)} dakika ${Math.floor(elapsed % 60)} saniye`);
    console.log(`📈 Ortalama: ${(stats.totalUniversities / stats.successfulPrograms).toFixed(1)} üniversite/bölüm`);
    console.log('─'.repeat(60) + '\n');
}

// Export
module.exports = {
    scrapeAllPrograms,
    getAllProgramCodes,
    getAllProgramCodesOnlisans,
    scrapeProgramUniversities,
    scrapeProgramDetails
};

// CLI kullanımı
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {
        startFrom: 0,
        limit: null,
        delayBetweenPrograms: 2000,
        delayBetweenUniversities: 500,
        saveToDb: true,
        saveJson: true
    };

    // Komut satırı argümanlarını parse et
    args.forEach(arg => {
        const [key, value] = arg.split('=');
        if (key === '--start') options.startFrom = parseInt(value);
        if (key === '--limit') options.limit = parseInt(value);
        if (key === '--delay') options.delayBetweenPrograms = parseInt(value);
        if (key === '--no-db') options.saveToDb = false;
        if (key === '--no-json') options.saveJson = false;
    });

    scrapeAllPrograms(options)
        .then(() => {
            console.log('✅ İşlem başarıyla tamamlandı!\n');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Fatal hata:', error);
            process.exit(1);
        });
}
