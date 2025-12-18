/**
 * YÖK Atlas Test Scraper - 5 bölüm ile test
 */

const puppeteer = require('puppeteer');
const { pool } = require('./db');

const TEST_DEPARTMENTS = [
    'Bilgisayar Mühendisliği',
    'Yazılım Mühendisliği',
    'İşletme',
    'Psikoloji',
    'Hukuk'
];

async function testScraping() {
    console.log('\n🧪 YÖK ATLAS TEST SCRAPING\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        args: ['--no-sandbox']
    });
    
    const page = await browser.newPage();
    
    try {
        // YÖK Atlas'a git
        console.log('📡 YÖK Atlas\'a bağlanılıyor...');
        await page.goto('https://yokatlas.yok.gov.tr/', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        console.log('✅ Bağlantı başarılı!\n');
        
        // Sayfanın yapısını incele
        const pageInfo = await page.evaluate(() => {
            return {
                title: document.title,
                url: window.location.href,
                links: document.querySelectorAll('a').length,
                inputs: document.querySelectorAll('input').length,
                forms: document.querySelectorAll('form').length
            };
        });
        
        console.log('📊 Sayfa Bilgileri:');
        console.log('   Title:', pageInfo.title);
        console.log('   URL:', pageInfo.url);
        console.log('   Links:', pageInfo.links);
        console.log('   Inputs:', pageInfo.inputs);
        console.log('   Forms:', pageInfo.forms);
        console.log('');
        
        // Screenshot al
        await page.screenshot({ 
            path: 'yok-atlas-homepage.png',
            fullPage: true 
        });
        console.log('📸 Screenshot alındı: yok-atlas-homepage.png\n');
        
        // HTML içeriğini kaydet
        const html = await page.content();
        require('fs').writeFileSync('yok-atlas-page.html', html);
        console.log('💾 HTML kaydedildi: yok-atlas-page.html\n');
        
        console.log('⏸️  Tarayıcı 10 saniye açık kalacak (manuel inceleme için)...');
        await page.waitForTimeout(10000);
        
    } catch (error) {
        console.error('❌ Hata:', error);
    }
    
    await browser.close();
    console.log('\n✅ Test tamamlandı!');
    process.exit(0);
}

testScraping();
