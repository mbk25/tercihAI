const puppeteer = require('puppeteer');
const mysql = require('mysql2/promise');

// MySQL bağlantı havuzu
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '12991453B',
    database: 'tercihai',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function scrapeYokAtlas(programName, city = 'İstanbul') {
    console.log(`\n🔍 "${programName}" için YÖK Atlas scraping başlıyor...`);
    console.log(`📍 Şehir: ${city}`);
    
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        // YÖK Atlas ana sayfası
        const searchUrl = `https://yokatlas.yok.gov.tr/lisans-bolum.php?b=${encodeURIComponent(programName)}`;
        console.log(`🌐 URL: ${searchUrl}`);
        
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Tablodan verileri çek
        const universities = await page.evaluate((cityFilter) => {
            const results = [];
            const rows = document.querySelectorAll('table tbody tr');
            
            rows.forEach(row => {
                const cols = row.querySelectorAll('td');
                if (cols.length >= 4) {
                    const uniName = cols[0]?.innerText?.trim();
                    const uniCity = cols[1]?.innerText?.trim();
                    const rankingText = cols[2]?.innerText?.trim();
                    const quotaText = cols[3]?.innerText?.trim();
                    
                    // Şehir filtresi
                    if (cityFilter && !uniCity.toLowerCase().includes(cityFilter.toLowerCase())) {
                        return;
                    }
                    
                    // Sıralama sayısını çıkar
                    const ranking = parseInt(rankingText?.replace(/\D/g, '')) || 0;
                    const quota = parseInt(quotaText?.replace(/\D/g, '')) || 0;
                    
                    if (uniName && ranking > 0) {
                        results.push({
                            name: uniName,
                            city: uniCity,
                            ranking: ranking,
                            quota: quota
                        });
                    }
                }
            });
            
            return results;
        }, city);
        
        console.log(`✅ ${universities.length} üniversite bulundu!`);
        
        // MySQL'e kaydet
        if (universities.length > 0) {
            const connection = await pool.getConnection();
            
            // Önce mevcut kayıtları sil
            await connection.query(
                'DELETE FROM universities WHERE department = ? AND city = ?',
                [programName, city]
            );
            
            // Yeni kayıtları ekle
            for (const uni of universities) {
                await connection.query(
                    'INSERT INTO universities (name, city, department, ranking, quota, type, year) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [uni.name, uni.city, programName, uni.ranking, uni.quota, 'Devlet', 2024]
                );
            }
            
            connection.release();
            console.log(`💾 ${universities.length} kayıt MySQL'e eklendi!`);
        }
        
        return universities;
        
    } catch (error) {
        console.error(`❌ Hata: ${error.message}`);
        return [];
    } finally {
        await browser.close();
    }
}

async function main() {
    console.log('🚀 YÖK ATLAS GERÇEK VERİ ÇEKME BAŞLADI\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const programs = [
        'Bilgisayar Programcılığı',
        'Bilgisayar Teknolojisi',
        'Web Tasarım ve Kodlama'
    ];
    
    for (const program of programs) {
        await scrapeYokAtlas(program, 'İstanbul');
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 saniye bekle
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TÜM VERİLER BAŞARIYLA ÇEKİLDİ!\n');
    
    // Toplam sayıyı göster
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
        'SELECT department, COUNT(*) as total FROM universities WHERE city = ? GROUP BY department',
        ['İstanbul']
    );
    connection.release();
    
    console.log('📊 ÖZET:');
    rows.forEach(row => {
        console.log(`   ${row.department}: ${row.total} üniversite`);
    });
    
    process.exit(0);
}

main().catch(console.error);
