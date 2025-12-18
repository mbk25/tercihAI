// Detaylı YÖK Atlas Scraper - Tüm HTML'i incele
const puppeteer = require('puppeteer');
const fs = require('fs');

const DEPARTMENT_CODE = '104810158'; // Bilgisayar Programcılığı
const YOK_ATLAS_BASE_URL = 'https://yokatlas.yok.gov.tr';
const YEAR = 2024;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeDetailed() {
    console.log('🚀 Detaylı scraping başlıyor...\n');
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

        const url = `${YOK_ATLAS_BASE_URL}/onlisans-univ.php?y=${YEAR}&k=${DEPARTMENT_CODE}`;
        
        console.log(`📡 URL: ${url}\n`);

        await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        console.log('✅ Sayfa yüklendi\n');
        await sleep(5000);

        // HTML'i kaydet
        const html = await page.content();
        fs.writeFileSync('yok-atlas-page.html', html, 'utf-8');
        console.log('💾 HTML kaydedildi: yok-atlas-page.html\n');

        // Screenshot kaydet
        await page.screenshot({ path: 'yok-atlas-full.png', fullPage: true });
        console.log('📸 Screenshot kaydedildi\n');

        // Sayfadaki tüm tabloları bul
        const tableInfo = await page.evaluate(() => {
            const tables = document.querySelectorAll('table');
            return Array.from(tables).map((table, idx) => ({
                index: idx,
                rowCount: table.querySelectorAll('tr').length,
                className: table.className,
                id: table.id,
                firstRowText: table.querySelector('tr')?.textContent.substring(0, 100)
            }));
        });

        console.log(`📊 Bulunan tablolar: ${tableInfo.length}\n`);
        tableInfo.forEach(t => {
            console.log(`Tablo ${t.index}: ${t.rowCount} satır, class: "${t.className}", id: "${t.id}"`);
            console.log(`   İlk satır: ${t.firstRowText}...\n`);
        });

        // Her tablo için veri çekmeyi dene
        for (let i = 0; i < tableInfo.length; i++) {
            console.log(`\n🔍 Tablo ${i} parse ediliyor...\n`);
            
            const data = await page.evaluate((tableIndex) => {
                const table = document.querySelectorAll('table')[tableIndex];
                const rows = table.querySelectorAll('tr');
                const results = [];

                rows.forEach((row, rowIdx) => {
                    const cells = row.querySelectorAll('td, th');
                    if (cells.length > 0) {
                        const rowData = Array.from(cells).map(cell => cell.textContent.trim());
                        results.push({ rowIndex: rowIdx, cells: rowData });
                    }
                });

                return results;
            }, i);

            if (data.length > 0) {
                console.log(`   📋 ${data.length} satır bulundu`);
                console.log(`   İlk 3 satır:\n`);
                data.slice(0, 3).forEach(row => {
                    console.log(`   ${row.rowIndex}: ${row.cells.join(' | ')}`);
                });
                console.log('');
            }
        }

        // Alternatif: div, span ve diğer elementleri kontrol et
        console.log('\n🔍 Alternatif elementler aranıyor...\n');
        
        const alternativeData = await page.evaluate(() => {
            // Üniversite ismi içeren tüm elementleri bul
            const allText = document.body.innerText;
            const hasUniversite = allText.toLowerCase().includes('üniversite') || 
                                 allText.toLowerCase().includes('universite');
            
            return {
                hasUniversite,
                bodyLength: allText.length,
                sampleText: allText.substring(0, 500)
            };
        });

        console.log(`📄 Sayfa içeriği:`);
        console.log(`   Üniversite kelimesi var mı: ${alternativeData.hasUniversite}`);
        console.log(`   Toplam metin uzunluğu: ${alternativeData.bodyLength}`);
        console.log(`   İlk 500 karakter:\n${alternativeData.sampleText}\n`);

        console.log('\n💡 İpucu: yok-atlas-page.html ve yok-atlas-full.png dosyalarını kontrol edin\n');

    } catch (error) {
        console.error('\n❌ HATA:', error.message);
        throw error;
    } finally {
        if (browser) {
            await sleep(3000); // Kullanıcının görmesi için bekle
            await browser.close();
        }
    }
}

scrapeDetailed()
    .then(() => {
        console.log('\n✅ Analiz tamamlandı!');
        process.exit(0);
    })
    .catch(err => {
        console.error('\n❌ Fatal hata:', err);
        process.exit(1);
    });
