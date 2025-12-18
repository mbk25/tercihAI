// Puppeteer ile İstanbul Bilgisayar Programcılığı Veri Çekme
const puppeteer = require('puppeteer');
const fs = require('fs');

const DEPARTMENT_CODE = '104810158'; // Bilgisayar Programcılığı (Önlisans)
const YOK_ATLAS_BASE_URL = 'https://yokatlas.yok.gov.tr';
const YEAR = 2024;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeWithPuppeteer() {
    console.log('🚀 Puppeteer başlatılıyor...\n');
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false, // Tarayıcıyı göster (debug için)
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled'
            ]
        });

        const page = await browser.newPage();
        
        // User agent ayarla
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        
        // Ekstra bot tespitini engelle
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false
            });
        });

        const url = `${YOK_ATLAS_BASE_URL}/onlisans-univ.php?y=${YEAR}&k=${DEPARTMENT_CODE}`;
        
        console.log(`📡 URL: ${url}\n`);
        console.log('⏳ Sayfa yükleniyor...\n');

        // Sayfaya git
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        console.log('✅ Sayfa yüklendi!\n');
        console.log('⏳ Tablo bulunuyor...\n');

        // Birkaç saniye bekle
        await sleep(3000);

        // Sayfayı screenshot olarak kaydet
        await page.screenshot({ path: 'yok-atlas-screenshot.png', fullPage: true });
        console.log('📸 Screenshot kaydedildi: yok-atlas-screenshot.png\n');

        // Tabloyu parse et
        const universities = await page.evaluate(() => {
            const results = [];
            const rows = document.querySelectorAll('table tbody tr');
            
            rows.forEach((row) => {
                const cells = row.querySelectorAll('td');
                
                if (cells.length >= 6) {
                    const universityName = cells[1]?.textContent.trim();
                    const cityName = cells[2]?.textContent.trim();
                    const programName = cells[3]?.textContent.trim();
                    const quota = parseInt(cells[4]?.textContent.trim()) || 0;
                    const enrolled = parseInt(cells[5]?.textContent.trim()) || 0;
                    const minRankingText = cells[6]?.textContent.trim().replace(/\./g, '');
                    const minRanking = parseInt(minRankingText) || 0;

                    if (universityName && minRanking > 0) {
                        results.push({
                            name: universityName,
                            city: cityName,
                            program: programName,
                            quota,
                            enrolled,
                            minRanking
                        });
                    }
                }
            });
            
            return results;
        });

        console.log(`📊 Toplam ${universities.length} üniversite bulundu\n`);

        // İstanbul'dakileri filtrele
        const istanbulUniversities = universities
            .filter(u => u.city && u.city.toLowerCase().includes('istanbul'))
            .map(u => ({
                ...u,
                department: 'Bilgisayar Programcılığı',
                type: u.name.toLowerCase().includes('vakıf') || 
                      u.name.toLowerCase().includes('vakif') ? 'Vakıf' : 'Devlet',
                year: YEAR
            }));

        console.log('='.repeat(100));
        console.log(`\n📍 İSTANBUL - BİLGİSAYAR PROGRAMCILIĞI: ${istanbulUniversities.length} ÜNİVERSİTE\n`);
        console.log('='.repeat(100) + '\n');

        if (istanbulUniversities.length === 0) {
            console.log('⚠️ İstanbul\'da sonuç bulunamadı!\n');
            console.log('🔍 Tüm şehirler:\n');
            universities.slice(0, 10).forEach((uni, idx) => {
                console.log(`${idx + 1}. ${uni.name} - ${uni.city}`);
            });
        } else {
            // Devlet ve Vakıf ayır
            const devlet = istanbulUniversities.filter(u => u.type === 'Devlet');
            const vakif = istanbulUniversities.filter(u => u.type === 'Vakıf');

            console.log(`🏛️  DEVLET ÜNİVERSİTELERİ (${devlet.length})\n`);
            devlet.forEach((uni, idx) => {
                console.log(`${idx + 1}. ${uni.name}`);
                console.log(`   📚 Program: ${uni.program}`);
                console.log(`   📊 Kontenjan: ${uni.quota} | Yerleşen: ${uni.enrolled}`);
                console.log(`   📈 Taban Sırası: ${uni.minRanking.toLocaleString('tr-TR')}`);
                console.log('   ' + '-'.repeat(90) + '\n');
            });

            console.log(`\n🏢 VAKIF ÜNİVERSİTELERİ (${vakif.length})\n`);
            vakif.forEach((uni, idx) => {
                console.log(`${idx + 1}. ${uni.name}`);
                console.log(`   📚 Program: ${uni.program}`);
                console.log(`   📊 Kontenjan: ${uni.quota} | Yerleşen: ${uni.enrolled}`);
                console.log(`   📈 Taban Sırası: ${uni.minRanking.toLocaleString('tr-TR')}`);
                console.log('   ' + '-'.repeat(90) + '\n');
            });

            // JSON dosyasına kaydet
            const outputData = {
                department: 'Bilgisayar Programcılığı',
                city: 'İstanbul',
                year: YEAR,
                totalCount: istanbulUniversities.length,
                devletCount: devlet.length,
                vakifCount: vakif.length,
                universities: istanbulUniversities,
                scrapedAt: new Date().toISOString()
            };

            fs.writeFileSync(
                'istanbul-bilgisayar-programciligi.json',
                JSON.stringify(outputData, null, 2),
                'utf-8'
            );

            console.log('\n✅ Veriler kaydedildi: istanbul-bilgisayar-programciligi.json\n');
        }

        return istanbulUniversities;

    } catch (error) {
        console.error('\n❌ HATA:', error.message);
        throw error;
    } finally {
        if (browser) {
            console.log('\n🔒 Tarayıcı kapatılıyor...');
            await browser.close();
        }
    }
}

// Çalıştır
scrapeWithPuppeteer()
    .then(data => {
        console.log(`\n✅ İşlem başarılı! ${data.length} üniversite verisi çekildi.`);
        process.exit(0);
    })
    .catch(err => {
        console.error('\n❌ Fatal hata:', err);
        process.exit(1);
    });
